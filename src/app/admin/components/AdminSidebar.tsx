'use client'

import { Button } from '@/components/ui/button'
import { Package, Users, X, Menu, ShoppingCart } from 'lucide-react'

interface AdminSidebarProps {
  activeSection: 'orders' | 'customers' | 'products'
  sidebarOpen: boolean
  onSectionChange?: (section: 'orders' | 'customers' | 'products') => void
  onToggleSidebar?: () => void
}

export function AdminSidebar({
  activeSection,
  sidebarOpen,
  onSectionChange,
  onToggleSidebar,
}: AdminSidebarProps) {
  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-16 bottom-0 left-0 z-40 w-64 bg-card border-r border-border
          transform transition-transform duration-300 ease-in-out lg:transform-none
          ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }
        `}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-serif">Admin Panel</h2>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => onToggleSidebar?.()}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="space-y-2">
            <button
              onClick={() => onSectionChange?.('orders')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeSection === 'orders'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ShoppingCart className="mr-3 h-5 w-5" />
              Orders
            </button>
            <button
              onClick={() => onSectionChange?.('customers')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeSection === 'customers'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="mr-3 h-5 w-5" />
              Customers
            </button>
            <button
              onClick={() => onSectionChange?.('products')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeSection === 'products'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Package className="mr-3 h-5 w-5" />
              Products
            </button>
          </nav>
        </div>
      </div>
    </>
  )
}

export function MobileHeader({
  activeSection,
  onToggleSidebar,
}: {
  activeSection: 'orders' | 'customers' | 'products'
  onToggleSidebar?: () => void
}) {
  return (
    <div className="lg:hidden bg-card border-b border-border p-4 flex items-center justify-between">
      <Button variant="ghost" size="sm" onClick={() => onToggleSidebar?.()}>
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-lg font-semibold">
        {activeSection === 'orders' ? 'Orders' : 
         activeSection === 'customers' ? 'Customers' : 'Products'}
      </h1>
      <div className="w-10" />
    </div>
  )
}
