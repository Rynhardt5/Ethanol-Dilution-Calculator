'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Loader2 } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { toast } from 'sonner'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  description: string | null
  images: string[]
  price: number
  currency: string
  metadata: Record<string, string>
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCartStore()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      description: product.description || undefined,
    })
    toast.success(`${product.name} added to cart!`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading products...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground font-serif">
            Premium Ethanol & Supplies
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            High-quality organic ethanol and herbalist supplies for your
            tincture making needs
          </p>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-semibold mb-2">
              No products available
            </h2>
            <p className="text-muted-foreground">
              Products will appear here once they are added to your Stripe
              account.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card
                key={product.id}
                className="border-2 hover:shadow-lg transition-shadow"
              >
                <CardHeader className="p-0">
                  {product.images[0] && (
                    <div className="relative h-[300px] w-full">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-contain rounded-t-lg"
                      />
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <CardTitle className="text-xl font-serif">
                        {product.name}
                      </CardTitle>
                      {product.description && (
                        <CardDescription className="mt-2">
                          {product.description}
                        </CardDescription>
                      )}
                    </div>

                    {/* Metadata badges */}
                    {Object.entries(product.metadata).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(product.metadata).map(
                          ([key, value]) => (
                            <Badge
                              key={key}
                              variant="secondary"
                              className="text-xs"
                            >
                              {key}: {value}
                            </Badge>
                          )
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-primary">
                        ${(product.price / 100).toFixed(2)}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          {product.currency.toUpperCase()}
                        </span>
                      </div>
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="flex items-center gap-2"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
