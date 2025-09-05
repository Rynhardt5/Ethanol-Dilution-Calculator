import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function GET() {
  try {
    // Fetch products from Stripe
    const products = await stripe.products.list({
      limit: 100,
      expand: ['data.default_price']
    })

    const productsWithPrices = products.data.map(product => {
      const defaultPrice = product.default_price as Stripe.Price | null
      
      return {
        id: product.id,
        name: product.name,
        description: product.description || undefined,
        price: defaultPrice?.unit_amount || 0,
        active: product.active,
        created: product.created,
        images: product.images || []
      }
    })

    return NextResponse.json(productsWithPrices)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, price, images } = await request.json()

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      )
    }

    // Create product in Stripe
    const product = await stripe.products.create({
      name,
      description: description || undefined,
      images: images || [],
      active: true
    })

    // Create default price for the product
    const priceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(price * 100), // Convert to cents
      currency: 'aud',
    })

    // Update product with default price
    await stripe.products.update(product.id, {
      default_price: priceObj.id
    })

    return NextResponse.json({ 
      success: true, 
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: priceObj.unit_amount,
        active: product.active,
        created: product.created,
        images: product.images
      }
    })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { productId, name, description, price, active, images } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Update product in Stripe
    const updateData: Stripe.ProductUpdateParams = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (active !== undefined) updateData.active = active
    if (images !== undefined) updateData.images = images

    await stripe.products.update(productId, updateData)

    // Update price if provided
    if (price !== undefined) {
      // Create new price
      const priceObj = await stripe.prices.create({
        product: productId,
        unit_amount: Math.round(price * 100), // Convert to cents
        currency: 'aud',
      })

      // Update product with new default price
      await stripe.products.update(productId, {
        default_price: priceObj.id
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Archive product in Stripe (soft delete)
    await stripe.products.update(productId, {
      active: false
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
