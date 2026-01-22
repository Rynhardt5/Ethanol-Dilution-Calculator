'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  CreditCard,
  Truck,
  MapPin,
  Tag,
  X,
  Loader2,
} from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { toast } from 'sonner'
import { calculateShippingCost, formatShippingCost } from '@/lib/shipping'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart } =
    useCartStore()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [collectionMethod, setCollectionMethod] = useState<
    'pickup' | 'shipping'
  >('shipping')
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromoCode, setAppliedPromoCode] = useState<{
    code: string
    discountPercentage: number
  } | null>(null)
  const [validatingPromo, setValidatingPromo] = useState(false)

  // Calculate shipping cost
  const shippingInfo = calculateShippingCost(items)
  const subtotal = getTotalPrice()
  const discount = appliedPromoCode
    ? Math.round(subtotal * (appliedPromoCode.discountPercentage / 100))
    : 0
  const totalAfterDiscount = subtotal - discount
  const totalWithShipping =
    collectionMethod === 'shipping'
      ? totalAfterDiscount + shippingInfo.cost
      : totalAfterDiscount

  // Check if shipping is restricted
  const hasShippingRestrictions = !shippingInfo.canShip

  // Auto-switch to pickup if shipping is restricted
  React.useEffect(() => {
    if (hasShippingRestrictions && collectionMethod === 'shipping') {
      setCollectionMethod('pickup')
    }
  }, [hasShippingRestrictions, collectionMethod])

  // Calculate shipping based on cart items

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(id)
      return
    }
    updateQuantity(id, newQuantity)
  }

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code')
      return
    }

    setValidatingPromo(true)
    try {
      const response = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Invalid promo code')
      }

      const data = await response.json()
      setAppliedPromoCode({
        code: data.code,
        discountPercentage: data.discountPercentage,
      })
      toast.success(`Promo code applied! ${data.discountPercentage}% off`)
      setPromoCode('')
    } catch (error) {
      console.error('Promo code error:', error)
      toast.error(error instanceof Error ? error.message : 'Invalid promo code')
    } finally {
      setValidatingPromo(false)
    }
  }

  const handleRemovePromoCode = () => {
    setAppliedPromoCode(null)
    toast.success('Promo code removed')
  }

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    // Check if shipping is selected but restricted
    if (collectionMethod === 'shipping' && hasShippingRestrictions) {
      toast.error(
        'Cannot ship items containing glass. Please select pickup instead.',
      )
      return
    }

    setIsCheckingOut(true)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          collectionMethod,
          shippingCost: collectionMethod === 'shipping' ? shippingInfo.cost : 0,
          promoCode: appliedPromoCode?.code,
          discountAmount: discount,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Failed to proceed to checkout')
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="mx-auto max-w-4xl">
          <div className="text-center py-20">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h1 className="text-3xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">
              Add some products from our shop to get started
            </p>
            <Button asChild>
              <a href="/shop">Continue Shopping</a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 w-full overflow-x-hidden">
      <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6 lg:space-y-8 w-full px-0">
        {/* Header */}
        <div className="text-center space-y-2 sm:space-y-4 px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground font-serif">
            Shopping Cart
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Review your items before checkout
          </p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 w-full min-w-0">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4 min-w-0 w-full">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Cart Items ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-3 sm:p-6 overflow-hidden">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 p-3 sm:p-4 border rounded-lg w-full min-w-0 overflow-hidden"
                  >
                    {/* Mobile: Image and main info */}
                    <div className="flex gap-3 w-full min-w-0">
                      {item.image && (
                        <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base leading-tight break-all max-w-full">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        {item.metadata?.glass === 'true' && (
                          <div className="flex items-center gap-1 mt-2">
                            <Badge variant="destructive" className="text-xs">
                              Contains Glass - Pickup Only
                            </Badge>
                          </div>
                        )}
                        <p className="text-base sm:text-lg font-bold text-primary mt-2">
                          ${(item.price / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Mobile: Quantity controls and remove button */}
                    <div className="flex items-center justify-between gap-3 w-full min-w-0">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.id,
                              parseInt(e.target.value) || 1,
                            )
                          }
                          className="w-14 h-8 text-center text-sm"
                          min="1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-medium whitespace-nowrap">
                          ${((item.price * item.quantity) / 100).toFixed(2)}
                        </span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-4 w-full min-w-0">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">
                  Collection Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-3 sm:p-6 pt-0 overflow-hidden">
                <div className="space-y-3">
                  <Label className="text-sm sm:text-base font-medium">
                    How would you like to receive your order?
                  </Label>

                  {hasShippingRestrictions && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                        <Truck className="h-4 w-4" />
                        Shipping Restriction
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {shippingInfo.restrictions.map((restriction, index) => (
                          <p key={index}>• {restriction}</p>
                        ))}
                        <p className="mt-1 font-medium">
                          Please select pickup instead.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        collectionMethod === 'pickup'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setCollectionMethod('pickup')}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-sm sm:text-base">
                            Collect in Person
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            Pick up from our location
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`border rounded-lg p-3 transition-colors ${
                        hasShippingRestrictions
                          ? 'border-destructive/50 bg-destructive/5 cursor-not-allowed opacity-60'
                          : collectionMethod === 'shipping'
                            ? 'border-primary bg-primary/5 cursor-pointer'
                            : 'border-border hover:border-primary/50 cursor-pointer'
                      }`}
                      onClick={() =>
                        !hasShippingRestrictions &&
                        setCollectionMethod('shipping')
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Truck
                          className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
                            hasShippingRestrictions
                              ? 'text-destructive'
                              : 'text-primary'
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-sm sm:text-base">
                            Ship to Address
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {hasShippingRestrictions
                              ? 'Not available - see restrictions above'
                              : 'Delivery to your address'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-3 sm:p-6 pt-0 overflow-hidden">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between gap-2 text-sm"
                    >
                      <span className="truncate min-w-0 flex-1">
                        <span className="break-words">{item.name}</span> ×{' '}
                        {item.quantity}
                      </span>
                      <span className="flex-shrink-0 font-medium">
                        ${((item.price * item.quantity) / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                {appliedPromoCode && (
                  <>
                    <div className="flex justify-between gap-2 text-sm">
                      <span>Subtotal</span>
                      <span className="flex-shrink-0 font-medium">
                        ${(subtotal / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">
                          {appliedPromoCode.code} (-
                          {appliedPromoCode.discountPercentage}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex-shrink-0 font-medium text-green-600">
                          -${(discount / 100).toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemovePromoCode}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {collectionMethod === 'shipping' && (
                  <>
                    {!appliedPromoCode && (
                      <div className="flex justify-between gap-2 text-sm">
                        <span>Subtotal</span>
                        <span className="flex-shrink-0 font-medium">
                          ${(getTotalPrice() / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="min-w-0 flex-1">
                        <span className="break-words">
                          Shipping ({shippingInfo.description})
                        </span>
                      </span>
                      <span className="flex-shrink-0 font-medium">
                        {shippingInfo.cost === 0
                          ? 'Free'
                          : formatShippingCost(shippingInfo.cost)}
                      </span>
                    </div>
                    {shippingInfo.breakdown.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        <div>Volume breakdown:</div>
                        {shippingInfo.breakdown.map((item, index) => (
                          <div key={index} className="ml-2">
                            • {item}
                          </div>
                        ))}
                      </div>
                    )}
                    <Separator />
                  </>
                )}

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="flex-shrink-0">
                    ${(totalWithShipping / 100).toFixed(2)}
                  </span>
                </div>

                {!appliedPromoCode && (
                  <div className="space-y-2">
                    <Label htmlFor="promoCode" className="text-sm font-medium">
                      Have a promo code?
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="promoCode"
                        value={promoCode}
                        onChange={(e) =>
                          setPromoCode(e.target.value.toUpperCase())
                        }
                        placeholder="Enter code"
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleApplyPromoCode()
                          }
                        }}
                      />
                      <Button
                        onClick={handleApplyPromoCode}
                        disabled={validatingPromo || !promoCode.trim()}
                        variant="outline"
                      >
                        {validatingPromo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Apply'
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full flex items-center gap-2"
                  size="lg"
                >
                  <CreditCard className="h-4 w-4" />
                  {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
                </Button>

                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="w-full"
                >
                  Clear Cart
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
