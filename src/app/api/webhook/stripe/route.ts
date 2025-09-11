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

  // Handle the checkout.session.completed event
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
        id: paymentIntent.id,
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
      } else {
        console.error('❌ GitHub Gist configuration missing - order not saved to Gist')
      }

    } catch (error) {
      console.error('Error processing webhook:', error)
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
