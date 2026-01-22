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

    // Add discount as a negative line item if promo code is applied
    if (promoCode && discountAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: `Discount (${promoCode})`,
          },
          unit_amount: -discountAmount,
        },
        quantity: 1,
      })
    }

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

    // Increment promo code usage count if a promo code was applied
    if (promoCode) {
      try {
        // Fetch current promo codes
        const promoCodesResponse = await fetch(
          `${request.nextUrl.origin}/api/promo-codes`,
          { cache: 'no-store' },
        )
        const { promoCodes } = await promoCodesResponse.json()

        // Find and update the promo code usage
        const promoCodeData = promoCodes.find(
          (pc: { code: string }) => pc.code === promoCode,
        )

        if (promoCodeData) {
          // Note: In a production environment, you'd want to update this in a database
          // For now, we're just tracking it in memory via the API
          promoCodeData.usageCount = (promoCodeData.usageCount || 0) + 1
        }
      } catch (error) {
        console.error('Error updating promo code usage:', error)
        // Don't fail the checkout if promo code tracking fails
      }
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    )
  }
}
