import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Customer, Order } from '../admin.types'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  active: boolean
  created: number
  images: string[]
}

export function useAdminData() {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [refunding, setRefunding] = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/customers')
      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Failed to load customers')
    }
  }, [])

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/orders')
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    }
  }, [])

  const fetchStripeOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stripe-orders')
      if (!response.ok) {
        throw new Error('Failed to fetch Stripe orders')
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching Stripe orders:', error)
      toast.error('Failed to load Stripe orders')
      return []
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/products')
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to fetch products')
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchOrders(), fetchCustomers(), fetchProducts()])
    setLoading(false)
  }, [fetchOrders, fetchCustomers, fetchProducts])

  const updateOrderStatus = async (
    orderId: string,
    status: Order['status']
  ) => {
    setUpdating(orderId)
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, status }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      )
      toast.success('Order status updated successfully')
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    } finally {
      setUpdating(null)
    }
  }

  const refundOrder = async (orderId: string, paymentIntentId: string) => {
    setRefunding(orderId)
    try {
      const response = await fetch('/api/admin/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentIntentId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process refund')
      }

      const data = await response.json()
      toast.success(
        `Refund processed successfully: $${(data.amount / 100).toFixed(2)}`
      )

      await fetchOrders()
    } catch (error) {
      console.error('Error processing refund:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to process refund'
      )
    } finally {
      setRefunding(null)
    }
  }

  return {
    orders,
    customers,
    products,
    loading,
    updating,
    refunding,
    fetchData,
    fetchStripeOrders,
    updateOrderStatus,
    refundOrder,
  }
}
