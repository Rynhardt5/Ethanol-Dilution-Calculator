import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { GitHubGistStorage, Order } from '@/lib/github-gist'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

// Development-only endpoint to manually sync recent Stripe orders to Gist
export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST method to sync orders',
    usage: 'POST /api/dev/sync-orders'
  })
}

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'This endpoint is only available in development' }, { status: 403 })
  }

  try {
    // Get recent payment intents from Stripe with expanded data
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 50,
      expand: [
        'data.latest_charge', 
        'data.customer', 
        'data.latest_charge.billing_details'
      ]
    })

    // Also get recent checkout sessions to find line items
    const checkoutSessions = await stripe.checkout.sessions.list({
      limit: 100,
      expand: ['data.line_items']
    })

    const gistStorage = new GitHubGistStorage(
      process.env.GITHUB_GIST_ID!,
      process.env.GITHUB_TOKEN!
    )

    const existingOrders = await gistStorage.getOrders()
    const existingOrderIds = new Set(existingOrders.map(order => order.id))

    let syncedCount = 0
    const newOrders: Order[] = []

    for (const pi of paymentIntents.data) {
      // Skip if already exists or not succeeded
      if (existingOrderIds.has(pi.id) || pi.status !== 'succeeded') {
        continue
      }

      // Find matching checkout session for this payment intent
      const matchingSession = checkoutSessions.data.find(session => 
        session.payment_intent === pi.id
      )

      // Debug: Log available data for troubleshooting
      console.log('Payment Intent Data for', pi.id, ':', {
        description: pi.description,
        metadata: pi.metadata,
        amount: pi.amount,
        hasCheckoutSession: !!matchingSession,
        sessionLineItems: matchingSession?.line_items?.data?.length || 0,
        alreadyExists: existingOrderIds.has(pi.id),
        status: pi.status,
        customerEmail: pi.receipt_email,
        created: new Date(pi.created * 1000).toISOString()
      })

      // Get customer information from various sources
      let customerName = 'Customer'
      let customerPhone = ''
      let shippingAddress = undefined

      // Try to get customer info from checkout session first
      if (matchingSession?.customer_details) {
        customerName = matchingSession.customer_details.name || customerName
        customerPhone = matchingSession.customer_details.phone || ''
        
        // Get shipping address from checkout session
        if ((matchingSession as any).shipping_details?.address) {
          const shippingAddr = (matchingSession as any).shipping_details.address
          shippingAddress = {
            line1: shippingAddr.line1 || '',
            line2: shippingAddr.line2 || undefined,
            city: shippingAddr.city || '',
            state: shippingAddr.state || '',
            postal_code: shippingAddr.postal_code || '',
            country: shippingAddr.country || ''
          }
        }
      }
      // Fallback to customer object
      else if (pi.customer && typeof pi.customer === 'object' && !pi.customer.deleted) {
        const customer = pi.customer as Stripe.Customer
        customerName = customer.name || customerName
        customerPhone = customer.phone || ''
        
        // Get shipping address if available
        if (customer.shipping?.address) {
          shippingAddress = {
            line1: customer.shipping.address.line1 || '',
            line2: customer.shipping.address.line2 || undefined,
            city: customer.shipping.address.city || '',
            state: customer.shipping.address.state || '',
            postal_code: customer.shipping.address.postal_code || '',
            country: customer.shipping.address.country || ''
          }
        }
      }

      // Final fallback to billing details from the charge
      if (pi.latest_charge && typeof pi.latest_charge === 'object') {
        const billing = pi.latest_charge.billing_details
        if (billing) {
          customerName = billing.name || customerName
          customerPhone = billing.phone || customerPhone
          
          // Use billing address as shipping if no shipping address found
          if (!shippingAddress && billing.address) {
            shippingAddress = {
              line1: billing.address.line1 || '',
              line2: billing.address.line2 || undefined,
              city: billing.address.city || '',
              state: billing.address.state || '',
              postal_code: billing.address.postal_code || '',
              country: billing.address.country || ''
            }
          }
        }
      }

      // Get line items from checkout session if available
      let items = [{
        id: 'manual-sync',
        name: pi.description || 'Product',
        price: pi.amount,
        quantity: 1
      }]

      let hasShippingItem = false
      let shippingCost = 0

      // Extract items from checkout session line items
      if (matchingSession?.line_items?.data) {
        const lineItems = []
        
        for (const lineItem of matchingSession.line_items.data) {
          const itemName = lineItem.description || lineItem.price?.nickname || 'Product'
          
          // Check if this is a shipping item
          if (itemName.toLowerCase().includes('shipping') || 
              itemName.toLowerCase().includes('delivery')) {
            hasShippingItem = true
            shippingCost += lineItem.amount_total || 0
          } else {
            // Regular product item
            lineItems.push({
              id: lineItem.id || 'line-item',
              name: itemName,
              price: lineItem.amount_total || 0,
              quantity: lineItem.quantity || 1
            })
          }
        }
        
        if (lineItems.length > 0) {
          items = lineItems
        }
      }
      // Fallback: Try to parse items from metadata if available
      else if (pi.metadata?.items) {
        try {
          const parsedItems = JSON.parse(pi.metadata.items)
          if (Array.isArray(parsedItems)) {
            items = parsedItems
          }
        } catch (_e) {
          console.log('Could not parse items from metadata for', pi.id)
        }
      }
      // Try to get product name from metadata fields
      else if (pi.metadata) {
        const productName = pi.metadata.product_name || 
                           pi.metadata.productName || 
                           pi.metadata.item_name ||
                           pi.metadata.itemName ||
                           pi.description
        if (productName) {
          items = [{
            id: 'manual-sync',
            name: productName,
            price: pi.amount,
            quantity: parseInt(pi.metadata.quantity || '1')
          }]
        }
      }

      // Determine collection method based on shipping cost from checkout session
      let collectionMethod: 'pickup' | 'shipping' = 'pickup'
      
      // Check for shipping cost in checkout session first (primary method)
      if (matchingSession && (matchingSession as any).shipping_cost?.amount_total) {
        shippingCost = (matchingSession as any).shipping_cost.amount_total
        if (shippingCost > 0) {
          collectionMethod = 'shipping'
        }
      }
      // Also check for shipping in total_details as backup
      else if (matchingSession && (matchingSession as any).total_details?.amount_shipping) {
        shippingCost = (matchingSession as any).total_details.amount_shipping
        if (shippingCost > 0) {
          collectionMethod = 'shipping'
        }
      }
      // If we found shipping items in the checkout line items, it's also a shipping order
      else if (hasShippingItem && shippingCost > 0) {
        collectionMethod = 'shipping'
      }
      // Fallback: Check for shipping cost in metadata
      else if (pi.metadata?.shipping_cost || pi.metadata?.shippingCost) {
        const metaShippingCost = parseInt(pi.metadata.shipping_cost || pi.metadata.shippingCost || '0')
        if (metaShippingCost > 0) {
          collectionMethod = 'shipping'
          shippingCost = metaShippingCost
        }
      }
      // Check if metadata explicitly indicates pickup/shipping
      else if (pi.metadata?.collection_method || pi.metadata?.collectionMethod) {
        const method = pi.metadata.collection_method || pi.metadata.collectionMethod
        if (method === 'shipping' || method === 'delivery') {
          collectionMethod = 'shipping'
        }
      }

      // Create order object
      const order: Order = {
        id: pi.id,
        customerEmail: pi.receipt_email || '',
        customerName,
        customerPhone: customerPhone || undefined,
        items,
        totalAmount: pi.amount,
        status: 'pending',
        paymentIntentId: pi.id,
        createdAt: new Date(pi.created * 1000).toISOString(),
        collectionMethod,
        shippingCost: shippingCost > 0 ? shippingCost : undefined,
        shippingAddress: collectionMethod === 'shipping' ? shippingAddress : undefined
      }

      newOrders.push(order)
      syncedCount++
      console.log('Prepared order for sync:', order.id, order.customerEmail)
    }

    // Save all new orders in a single batch to avoid conflicts
    if (newOrders.length > 0) {
      const existingOrders = await gistStorage.getOrders()
      const allOrders = [...existingOrders, ...newOrders]
      await gistStorage.saveOrdersBatch(allOrders)
      console.log('✅ Batch saved', newOrders.length, 'orders to Gist')
    }

    return NextResponse.json({ 
      message: `Synced ${syncedCount} new orders to Gist`,
      syncedCount,
      totalPaymentIntents: paymentIntents.data.length,
      existingOrderCount: existingOrders.length,
      newOrdersProcessed: newOrders.length
    })

  } catch (error) {
    console.error('Error syncing orders:', error)
    return NextResponse.json({ error: 'Failed to sync orders' }, { status: 500 })
  }
}
