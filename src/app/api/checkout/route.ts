import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { extractVolumeFromProductName } from '@/lib/shipping'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  metadata?: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    const { items, collectionMethod, shippingCost, promoCode, discountAmount } =
      await request.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    // Check for shipping restrictions when shipping is selected
    if (collectionMethod === 'shipping') {
      // Check for glass products
      const hasGlassProducts = items.some(
        (item: CartItem) => item.metadata?.glass === 'true',
      )
      if (hasGlassProducts) {
        return NextResponse.json(
          {
            error:
              'Cannot ship items containing glass. Please select pickup instead.',
          },
          { status: 400 },
        )
      }

      // Check for volume limit (5L = 5000mL)
      let totalVolume = 0
      items.forEach((item: CartItem) => {
        const volumePerItem = extractVolumeFromProductName(item.name)
        totalVolume += volumePerItem * item.quantity
      })

      if (totalVolume > 5000) {
        return NextResponse.json(
          {
            error: `Total volume ${(totalVolume / 1000).toFixed(1)}L exceeds 5L shipping limit. Please select pickup instead.`,
          },
          { status: 400 },
        )
      }
    }

    // Calculate total before discount
    const subtotal = items.reduce(
      (sum: number, item: CartItem) => sum + item.price * item.quantity,
      0,
    )

    // Calculate discount multiplier (e.g., 10% off = 0.90)
    const discountMultiplier =
      promoCode && discountAmount > 0
        ? Math.max(0, (subtotal - discountAmount) / subtotal)
        : 1

    // Create line items for Stripe with discount applied proportionally
    const lineItems = items.map((item: CartItem) => ({
      price_data: {
        currency: 'aud',
        product_data: {
          name: item.name,
          description: promoCode ? `Discount applied: ${promoCode}` : undefined,
        },
        // Apply discount proportionally and ensure it's an integer
        unit_amount: Math.round(item.price * discountMultiplier),
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
        promoCode: promoCode || '',
        discountAmount: discountAmount?.toString() || '0',
      },
      customer_creation: 'always',
      phone_number_collection: {
        enabled: true,
      },
    }

    // Only collect shipping address if method is shipping
    const sessionConfig =
      collectionMethod === 'shipping'
        ? {
            ...baseConfig,
            shipping_address_collection: {
              allowed_countries: ['AU'],
            },
          }
        : baseConfig

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await stripe.checkout.sessions.create(sessionConfig as any)

    // Note: Promo code usage count is incremented in the webhook handler
    // after successful payment is confirmed

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    )
  }
}
