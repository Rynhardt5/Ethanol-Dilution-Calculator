'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Minus, Plus, ShoppingCart, Trash2, CreditCard, Truck, MapPin } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { toast } from 'sonner'
import { calculateShippingCost, formatShippingCost } from '@/lib/shipping'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart } = useCartStore()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [collectionMethod, setCollectionMethod] = useState<'pickup' | 'shipping'>('shipping')

  // Calculate shipping cost
  const shippingInfo = calculateShippingCost(items)
  const totalWithShipping = collectionMethod === 'shipping' 
    ? getTotalPrice() + shippingInfo.cost 
    : getTotalPrice()

  // Debug: Log volume detection for troubleshooting
  console.log('Cart items and shipping calculation:', {
    items: items.map(item => ({ name: item.name, quantity: item.quantity })),
    shippingInfo,
    breakdown: shippingInfo.breakdown
  })

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(id)
      return
    }
    updateQuantity(id, newQuantity)
  }

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty')
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
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          collectionMethod,
          shippingCost: collectionMethod === 'shipping' ? shippingInfo.cost : 0
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
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground font-serif">
            Shopping Cart
          </h1>
          <p className="text-lg text-muted-foreground">
            Review your items before checkout
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Cart Items ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    {item.image && (
                      <div className="relative h-16 w-16 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {item.description}
                        </p>
                      )}
                      <p className="text-lg font-bold text-primary">
                        ${(item.price / 100).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                        className="w-16 text-center"
                        min="1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Collection Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-base font-medium">How would you like to receive your order?</Label>
                  
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
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium">Collect in Person</div>
                          <div className="text-sm text-muted-foreground">Pick up from our location</div>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        collectionMethod === 'shipping' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setCollectionMethod('shipping')}
                    >
                      <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium">Ship to Address</div>
                          <div className="text-sm text-muted-foreground">Delivery to your address</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>${((item.price * item.quantity) / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                {collectionMethod === 'shipping' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${(getTotalPrice() / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping ({shippingInfo.description})</span>
                      <span>{shippingInfo.cost === 0 ? 'Free' : formatShippingCost(shippingInfo.cost)}</span>
                    </div>
                    {shippingInfo.breakdown.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        <div>Volume breakdown:</div>
                        {shippingInfo.breakdown.map((item, index) => (
                          <div key={index} className="ml-2">• {item}</div>
                        ))}
                      </div>
                    )}
                    <Separator />
                  </>
                )}
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${(totalWithShipping / 100).toFixed(2)}</span>
                </div>

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
