import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { GitHubGistStorage, Order } from '@/lib/github-gist'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`🔔 Webhook received: ${event.type} [${event.id}]`)

  // Only handle checkout.session.completed events to avoid duplicate order creation
  // charge.updated events are ignored as they don't contain complete order information
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      // Get the payment intent to access more details
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent as string,
        {
          expand: ['latest_charge']
        }
      )

      // Parse items from metadata
      let items = []
      if (session.metadata?.items) {
        try {
          items = JSON.parse(session.metadata.items)
        } catch (error) {
          console.error('Error parsing items from metadata:', error)
          items = [{
            id: 'unknown',
            name: 'Product',
            price: session.amount_total || 0,
            quantity: 1
          }]
        }
      }

      // Create order object for Gist
      const order: Order = {
        id: paymentIntent.id, // Use payment intent ID consistently
        customerEmail: session.customer_details?.email || '',
        customerName: session.customer_details?.name || 'Guest Customer',
        customerPhone: session.customer_details?.phone || undefined,
        items: items.map((item: any) => ({
          id: item.id || 'unknown',
          name: item.name || 'Product',
          price: item.price || 0,
          quantity: item.quantity || 1
        })),
        totalAmount: session.amount_total || 0,
        status: 'pending',
        paymentIntentId: paymentIntent.id,
        createdAt: new Date().toISOString(),
        collectionMethod: (session.metadata?.collectionMethod as 'pickup' | 'shipping') || 'shipping',
        shippingCost: session.metadata?.shippingCost ? parseInt(session.metadata.shippingCost) : undefined,
        shippingAddress: (() => {
          const sessionData = session as any
          if (sessionData.shipping_details?.address) {
            const addr = sessionData.shipping_details.address
            return {
              line1: addr.line1 || '',
              line2: addr.line2 || undefined,
              city: addr.city || '',
              state: addr.state || '',
              postal_code: addr.postal_code || '',
              country: addr.country || 'AU'
            }
          }
          return undefined
        })()
      }

      // Save to GitHub Gist
      if (process.env.GITHUB_GIST_ID && process.env.GITHUB_TOKEN) {
        const gistStorage = new GitHubGistStorage(
          process.env.GITHUB_GIST_ID,
          process.env.GITHUB_TOKEN
        )
        
        await gistStorage.saveOrder(order)
        console.log('✅ Order saved to GitHub Gist:', order.id)

        // Increment promo code usage count if a promo code was applied
        const promoCode = session.metadata?.promoCode
        if (promoCode) {
          try {
            const promoCodes = await gistStorage.getPromoCodes()
            const promoCodeData = promoCodes.find((pc) => pc.code === promoCode)

            if (promoCodeData) {
              // Increment usage count and save to GitHub Gist
              promoCodeData.usageCount = (promoCodeData.usageCount || 0) + 1
              await gistStorage.savePromoCode(promoCodeData)
              console.log(`✅ Incremented usage count for promo code: ${promoCode} (now ${promoCodeData.usageCount} uses)`)
            }
          } catch (error) {
            console.error('Error updating promo code usage:', error)
            // Don't fail the webhook if promo code tracking fails
          }
        }
      } else {
        console.error('❌ GitHub Gist configuration missing - order not saved to Gist')
      }

    } catch (error) {
      console.error('Error processing webhook:', error)
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
  } else {
    // Log other webhook events but don't process them
    console.log(`ℹ️  Ignoring webhook event: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
