import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function GET() {
  try {
    // Fetch refunds from Stripe
    const refunds = await stripe.refunds.list({
      limit: 100,
      expand: ['data.charge', 'data.payment_intent']
    })

    const refundsWithDetails = await Promise.all(
      refunds.data.map(async (refund) => {
        let customerEmail = undefined
        
        // Try to get customer email from payment intent
        if (refund.payment_intent && typeof refund.payment_intent === 'object') {
          const customer = refund.payment_intent.customer
          if (customer && typeof customer === 'string') {
            try {
              const customerData = await stripe.customers.retrieve(customer)
              if ('email' in customerData) {
                customerEmail = customerData.email || undefined
              }
            } catch (error) {
              console.error('Error fetching customer for refund:', error)
            }
          }
        }

        return {
          id: refund.id,
          amount: refund.amount,
          currency: refund.currency,
          status: refund.status,
          reason: refund.reason || undefined,
          created: refund.created,
          charge: refund.charge as string,
          paymentIntent: typeof refund.payment_intent === 'string' 
            ? refund.payment_intent 
            : refund.payment_intent?.id || '',
          customerEmail
        }
      })
    )

    return NextResponse.json(refundsWithDetails)
  } catch (error) {
    console.error('Error fetching refunds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch refunds' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, amount } = await request.json()

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID is required' },
        { status: 400 }
      )
    }

    // Create refund in Stripe
    const refundData: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer'
    }

    if (amount) {
      refundData.amount = amount
    }

    const refund = await stripe.refunds.create(refundData)

    // Get customer email for the response
    let customerEmail = undefined
    if (refund.payment_intent && typeof refund.payment_intent === 'object') {
      const customer = refund.payment_intent.customer
      if (customer && typeof customer === 'string') {
        try {
          const customerData = await stripe.customers.retrieve(customer)
          if ('email' in customerData) {
            customerEmail = customerData.email || undefined
          }
        } catch (error) {
          console.error('Error fetching customer for refund:', error)
        }
      }
    }

    const refundResponse = {
      id: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason || undefined,
      created: refund.created,
      charge: refund.charge as string,
      paymentIntent: typeof refund.payment_intent === 'string' 
        ? refund.payment_intent 
        : refund.payment_intent?.id || '',
      customerEmail
    }

    return NextResponse.json(refundResponse)
  } catch (error) {
    console.error('Error creating refund:', error)
    return NextResponse.json(
      { error: 'Failed to create refund' },
      { status: 500 }
    )
  }
}
