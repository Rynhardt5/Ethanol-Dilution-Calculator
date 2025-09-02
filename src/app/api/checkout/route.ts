import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { items, collectionMethod, shippingCost } = await request.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    interface CartItem {
      id: string
      name: string
      price: number
      quantity: number
    }

    // Create line items for Stripe
    const lineItems = items.map((item: CartItem) => ({
      price_data: {
        currency: 'aud',
        product_data: {
          name: item.name,
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    }))

    // Add shipping cost as a line item if shipping method is selected and cost > 0
    if (collectionMethod === 'shipping' && shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Shipping - Australia Wide',
          },
          unit_amount: shippingCost,
        },
        quantity: 1,
      })
    }

    // Create Stripe checkout session
    const baseConfig = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/cart`,
      metadata: {
        items: JSON.stringify(items),
        collectionMethod: collectionMethod || 'shipping',
        shippingCost: shippingCost?.toString() || '0',
      },
      customer_creation: 'always',
      phone_number_collection: {
        enabled: true,
      },
    }

    // Only collect shipping address if method is shipping
    console.log('Collection method received:', collectionMethod)
    const sessionConfig = collectionMethod === 'shipping' 
      ? {
          ...baseConfig,
          shipping_address_collection: {
            allowed_countries: ['AU'],
          }
        }
      : baseConfig

    if (collectionMethod === 'shipping') {
      console.log('✅ Shipping address collection ENABLED for countries:', ['AU'])
    } else {
      console.log('❌ Collection method is pickup, no shipping address needed')
    }

    console.log('Final session config:', JSON.stringify(sessionConfig, null, 2))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await stripe.checkout.sessions.create(sessionConfig as any)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
