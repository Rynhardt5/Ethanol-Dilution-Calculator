'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Calculator, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/lib/cart-store'
import Image from 'next/image'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useState } from 'react'

export function Navigation() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { items } = useCartStore()
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const NavigationLinks = ({
    setOpen,
  }: {
    setOpen: (open: boolean) => void
  }) => (
    <>
      <Link href="/" onClick={() => setOpen(false)}>
        <Button
          variant={pathname === '/' ? 'default' : 'ghost'}
          size="sm"
          className="flex items-center gap-2 w-full justify-start"
        >
          <Calculator className="h-4 w-4" />
          Calculator
        </Button>
      </Link>

      <Link href="/shop" onClick={() => setOpen(false)}>
        <Button
          variant={pathname === '/shop' ? 'default' : 'ghost'}
          size="sm"
          className="w-full justify-start"
        >
          Shop
        </Button>
      </Link>

      <Link href="/extraction" onClick={() => setOpen(false)}>
        <Button
          variant={pathname === '/extraction' ? 'default' : 'ghost'}
          size="sm"
          className="flex items-center gap-2 w-full justify-start"
        >
          Extraction
        </Button>
      </Link>

      <Link href="/cart" onClick={() => setOpen(false)}>
        <Button
          variant={pathname === '/cart' ? 'default' : 'outline'}
          size="sm"
          className="relative flex items-center gap-2 w-full justify-start"
        >
          <ShoppingCart className="h-4 w-4" />
          Cart
          {itemCount > 0 && (
            <Badge
              variant="destructive"
              className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </Link>
    </>
  )

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

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
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

            <Link href="/extraction">
              <Button
                variant={pathname === '/extraction' ? 'default' : 'ghost'}
                size="sm"
                className="flex items-center gap-2"
              >
                Extraction
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

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-2">
            {/* Cart Icon for Mobile */}
            <Link href="/cart">
              <Button
                variant={pathname === '/cart' ? 'default' : 'outline'}
                size="sm"
                className="relative"
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

            {/* Mobile Menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6 mx-2">
                  <NavigationLinks setOpen={setOpen} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
