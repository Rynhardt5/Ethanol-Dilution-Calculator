'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/lib/cart-store'
import Image from 'next/image'

export function Navigation() {
  const pathname = usePathname()
  const { items } = useCartStore()
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/fox-logo.png"
              alt="Fox Logo"
              className="w-8 h-8"
              width={32}
              height={32}
            />
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button
                variant={pathname === '/' ? 'default' : 'ghost'}
                size="sm"
                className="flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                Calculator
              </Button>
            </Link>

            <Link href="/shop">
              <Button
                variant={pathname === '/shop' ? 'default' : 'ghost'}
                size="sm"
              >
                Shop
              </Button>
            </Link>

            {/* Cart Icon */}
            <Link href="/cart">
              <Button
                variant={pathname === '/cart' ? 'default' : 'outline'}
                size="sm"
                className="relative flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                {itemCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
