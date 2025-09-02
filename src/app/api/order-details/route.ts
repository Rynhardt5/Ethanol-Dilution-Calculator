import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { GitHubGistStorage } from '@/lib/github-gist'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Retrieve the session from Stripe - shipping_details is included by default
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Save order to GitHub Gist if environment variables are set
    if (process.env.GITHUB_GIST_ID && process.env.GITHUB_TOKEN) {
      try {
        const gistStorage = new GitHubGistStorage(
          process.env.GITHUB_GIST_ID,
          process.env.GITHUB_TOKEN
        )

        // Debug: Log shipping details from Stripe
        console.log('=== STRIPE SESSION DEBUG ===')
        console.log('Session ID:', (session as any).id)
        console.log('Payment status:', (session as any).payment_status)
        console.log('Collection method from metadata:', (session as any).metadata?.collectionMethod)
        console.log('Full session object keys:', Object.keys(session))
        console.log('Raw shipping_details:', (session as any).shipping_details)
        console.log('Raw shipping_cost:', (session as any).shipping_cost)
        console.log('Raw customer_details:', (session as any).customer_details)
        console.log('Session mode:', (session as any).mode)
        console.log('Session status:', (session as any).status)
        
        // Check if shipping address collection was enabled
        console.log('Shipping address collection config:', (session as any).shipping_address_collection)
        console.log('=== END DEBUG ===')

        // Extract shipping address - Stripe stores it in customer_details.address when shipping_details is undefined
        const shippingDetails = (session as any).shipping_details
        const customerDetails = (session as any).customer_details
        
        const shippingAddress = shippingDetails?.address ? {
          line1: shippingDetails.address.line1 || '',
          line2: shippingDetails.address.line2 || undefined,
          city: shippingDetails.address.city || '',
          state: shippingDetails.address.state || '',
          postal_code: shippingDetails.address.postal_code || '',
          country: shippingDetails.address.country || '',
        } : customerDetails?.address ? {
          line1: customerDetails.address.line1 || '',
          line2: customerDetails.address.line2 || undefined,
          city: customerDetails.address.city || '',
          state: customerDetails.address.state || '',
          postal_code: customerDetails.address.postal_code || '',
          country: customerDetails.address.country || '',
        } : undefined

        const order = {
          id: (session as any).id,
          customerEmail: (session as any).customer_details?.email || '',
          customerName: (session as any).customer_details?.name || '',
          customerPhone: (session as any).customer_details?.phone || undefined,
          items: JSON.parse((session as any).metadata?.items || '[]'),
          totalAmount: (session as any).amount_total || 0,
          status: 'pending' as const,
          paymentIntentId: (session as any).payment_intent as string,
          createdAt: new Date().toISOString(),
          collectionMethod: ((session as any).metadata?.collectionMethod as 'pickup' | 'shipping') || 'shipping',
          shippingCost: (session as any).metadata?.shippingCost ? parseInt((session as any).metadata.shippingCost) : undefined,
          shippingAddress,
        }

        console.log('Order being saved:', order)

        await gistStorage.saveOrder(order)
      } catch (gistError) {
        console.error('Error saving to GitHub Gist:', gistError)
        // Don't fail the request if Gist saving fails
      }
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error retrieving order details:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve order details' },
      { status: 500 }
    )
  }
}
