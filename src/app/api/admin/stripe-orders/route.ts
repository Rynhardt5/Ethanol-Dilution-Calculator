import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

interface StripeOrderData {
  id: string
  customerEmail: string
  customerName: string
  customerPhone?: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentIntentId: string
  createdAt: string
  shippingAddress?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }
}

async function getAllPaymentIntents(): Promise<Stripe.PaymentIntent[]> {
  let allPaymentIntents: Stripe.PaymentIntent[] = []
  let hasMore = true
  let startingAfter: string | undefined = undefined

  while (hasMore) {
    try {
      const paymentIntents: Stripe.ApiList<Stripe.PaymentIntent> = await stripe.paymentIntents.list({
        limit: 100,
        starting_after: startingAfter,
        expand: ['data.customer', 'data.latest_charge.billing_details']
      })

      allPaymentIntents = allPaymentIntents.concat(paymentIntents.data)
      hasMore = paymentIntents.has_more
      
      if (hasMore && paymentIntents.data.length > 0) {
        startingAfter = paymentIntents.data[paymentIntents.data.length - 1].id
      }
    } catch (error) {
      console.error('Error fetching payment intents:', error)
      break
    }
  }

  return allPaymentIntents
}

async function getAllCharges(): Promise<Stripe.Charge[]> {
  let allCharges: Stripe.Charge[] = []
  let hasMore = true
  let startingAfter: string | undefined = undefined

  while (hasMore) {
    try {
      const charges: Stripe.ApiList<Stripe.Charge> = await stripe.charges.list({
        limit: 100,
        starting_after: startingAfter
      })

      allCharges = allCharges.concat(charges.data)
      hasMore = charges.has_more
      
      if (hasMore && charges.data.length > 0) {
        startingAfter = charges.data[charges.data.length - 1].id
      }
    } catch (error) {
      console.error('Error fetching charges:', error)
      break
    }
  }

  return allCharges
}

function mapPaymentIntentToOrder(pi: Stripe.PaymentIntent): StripeOrderData {
  // Get customer info from the payment intent
  const customer = pi.customer as Stripe.Customer | null
  
  // Get billing details from latest charge if available
  let billingDetails: Stripe.Charge.BillingDetails | null = null
  if (pi.latest_charge && typeof pi.latest_charge === 'object') {
    billingDetails = (pi.latest_charge as Stripe.Charge).billing_details
  }

  // Extract items from metadata or description
  const items = []
  if (pi.metadata?.items) {
    try {
      items.push(...JSON.parse(pi.metadata.items))
    } catch {
      // Fallback to single item from description
      items.push({
        name: pi.description || 'Product',
        quantity: 1,
        price: pi.amount
      })
    }
  } else {
    items.push({
      name: pi.description || 'Product',
      quantity: 1,
      price: pi.amount
    })
  }

  // Map Stripe status to order status
  let orderStatus: StripeOrderData['status'] = 'pending'
  if (pi.status === 'succeeded') {
    orderStatus = pi.metadata?.order_status as StripeOrderData['status'] || 'processing'
  } else if (pi.status === 'canceled') {
    orderStatus = 'cancelled'
  }

  return {
    id: pi.id,
    customerEmail: customer?.email || billingDetails?.email || '',
    customerName: customer?.name || billingDetails?.name || 'Guest Customer',
    customerPhone: customer?.phone || billingDetails?.phone || undefined,
    items,
    total: pi.amount,
    status: orderStatus,
    paymentIntentId: pi.id,
    createdAt: new Date(pi.created * 1000).toISOString(),
    shippingAddress: billingDetails?.address ? {
      line1: billingDetails.address.line1 || undefined,
      line2: billingDetails.address.line2 || undefined,
      city: billingDetails.address.city || undefined,
      state: billingDetails.address.state || undefined,
      postal_code: billingDetails.address.postal_code || undefined,
      country: billingDetails.address.country || undefined,
    } : undefined
  }
}

function mapChargeToOrder(charge: Stripe.Charge): StripeOrderData {
  const billingDetails = charge.billing_details

  // Extract items from metadata or description
  const items = []
  if (charge.metadata?.items) {
    try {
      items.push(...JSON.parse(charge.metadata.items))
    } catch {
      // Fallback to single item from description
      items.push({
        name: charge.description || 'Product',
        quantity: 1,
        price: charge.amount
      })
    }
  } else {
    items.push({
      name: charge.description || 'Product',
      quantity: 1,
      price: charge.amount
    })
  }

  // Map charge status to order status
  let orderStatus: StripeOrderData['status'] = 'pending'
  if (charge.status === 'succeeded') {
    orderStatus = charge.metadata?.order_status as StripeOrderData['status'] || 'processing'
  } else if (charge.status === 'failed') {
    orderStatus = 'cancelled'
  }

  return {
    id: charge.id,
    customerEmail: billingDetails?.email || '',
    customerName: billingDetails?.name || 'Guest Customer',
    customerPhone: billingDetails?.phone || undefined,
    items,
    total: charge.amount,
    status: orderStatus,
    paymentIntentId: charge.payment_intent as string || charge.id,
    createdAt: new Date(charge.created * 1000).toISOString(),
    shippingAddress: billingDetails?.address ? {
      line1: billingDetails.address.line1 || undefined,
      line2: billingDetails.address.line2 || undefined,
      city: billingDetails.address.city || undefined,
      state: billingDetails.address.state || undefined,
      postal_code: billingDetails.address.postal_code || undefined,
      country: billingDetails.address.country || undefined,
    } : undefined
  }
}

export async function GET() {
  try {
    console.log('Fetching Stripe orders for customer refund matching...')
    
    // Fetch both payment intents and standalone charges in parallel
    const [paymentIntents, allCharges] = await Promise.all([
      getAllPaymentIntents(),
      getAllCharges()
    ])
    
    // Filter to only succeeded payment intents (registered customer orders)
    const succeededPaymentIntents = paymentIntents.filter(pi => pi.status === 'succeeded')
    
    // Filter to guest charges (charges without customer ID and not linked to payment intents)
    const paymentIntentIds = new Set(paymentIntents.map(pi => pi.id))
    const guestCharges = allCharges.filter(charge => 
      !charge.customer && 
      charge.status === 'succeeded' &&
      (!charge.payment_intent || !paymentIntentIds.has(charge.payment_intent as string))
    )
    
    console.log(`Found ${succeededPaymentIntents.length} customer orders and ${guestCharges.length} guest orders from Stripe`)
    
    // Map both types to orders
    const customerOrders: StripeOrderData[] = succeededPaymentIntents.map(mapPaymentIntentToOrder)
    const guestOrders: StripeOrderData[] = guestCharges.map(mapChargeToOrder)
    
    // Combine all orders
    const allOrders = [...customerOrders, ...guestOrders]
    
    // Sort by creation date (newest first)
    allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    console.log(`Total Stripe orders for refund matching: ${allOrders.length}`)
    
    return NextResponse.json(allOrders)
  } catch (error) {
    console.error('Error fetching Stripe orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Stripe orders' },
      { status: 500 }
    )
  }
}
