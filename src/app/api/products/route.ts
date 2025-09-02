import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

export async function GET() {
  try {
    // Fetch products from Stripe
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    })

    // Transform Stripe products to our format
    const transformedProducts = products.data.map((product) => {
      const price = product.default_price as Stripe.Price | null
      
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        price: price?.unit_amount || 0,
        currency: price?.currency || 'aud',
        metadata: product.metadata,
      }
    })

    return NextResponse.json(transformedProducts)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
