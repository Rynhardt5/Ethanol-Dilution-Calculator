'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import Link from 'next/link'

function SuccessPageContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [orderDetails, setOrderDetails] = useState<{
    id: string
    customer_details?: {
      name?: string
      email?: string
    }
    shipping?: {
      address: {
        line1: string
        line2?: string
        city: string
        state: string
        postal_code: string
        country: string
      }
    }
    amount_total: number
  } | null>(null)
  const { clearCart } = useCartStore()

  useEffect(() => {
    if (sessionId) {
      fetchOrderDetails(sessionId)
      clearCart() // Clear cart after successful payment
    }
  }, [sessionId, clearCart])

  const fetchOrderDetails = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/order-details?session_id=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setOrderDetails(data)
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Processing your order...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground font-serif mb-2">
            Order Successful!
          </h1>
          <p className="text-lg text-muted-foreground">
            Thank you for your purchase. Your order has been confirmed.
          </p>
        </div>

        {orderDetails && (
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>Order ID: {orderDetails.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <p>{orderDetails.customer_details?.name}</p>
                <p>{orderDetails.customer_details?.email}</p>
              </div>

              {orderDetails.shipping && (
                <div>
                  <h3 className="font-semibold mb-2">Shipping Address</h3>
                  <div className="text-sm text-muted-foreground">
                    <p>{orderDetails.shipping.address.line1}</p>
                    {orderDetails.shipping.address.line2 && (
                      <p>{orderDetails.shipping.address.line2}</p>
                    )}
                    <p>
                      {orderDetails.shipping.address.city},{' '}
                      {orderDetails.shipping.address.state}{' '}
                      {orderDetails.shipping.address.postal_code}
                    </p>
                    <p>{orderDetails.shipping.address.country}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Total Amount</h3>
                <p className="text-2xl font-bold text-primary">
                  ${(orderDetails.amount_total / 100).toFixed(2)}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">
                  What&apos;s Next?
                </h3>
                <p className="text-sm text-blue-800 mb-2">
                  We&apos;ll process your order and prepare it for fulfillment.
                  If you selected in-person pickup, we&apos;ll contact you when
                  your order is ready for collection. For shipping orders,
                  we&apos;ll dispatch your items and provide tracking
                  information.
                </p>
                <p className="text-xs text-blue-700 font-medium">
                  Please save your order details above - no email confirmation
                  will be sent.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to Calculator</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background p-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading...</span>
          </div>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  )
}
