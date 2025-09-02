import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

// Client-side Stripe instance
export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
}

export interface StripeProduct {
  id: string
  name: string
  description: string | null
  images: string[]
  default_price: {
    id: string
    unit_amount: number
    currency: string
  }
  metadata: Record<string, string>
}
