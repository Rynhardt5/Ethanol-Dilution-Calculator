export interface Order {
  id: string
  customerEmail: string
  customerName: string
  customerPhone?: string
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
  totalAmount: number
  status: 'pending' | 'collected' | 'shipped'
  paymentIntentId: string
  createdAt: string
  collectionMethod: 'pickup' | 'shipping'
  shippingCost?: number
  shippingAddress?: {
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  notes?: string
}

export interface Customer {
  id: string
  email: string
  name: string
  phone?: string
  created: number
  totalSpent: number
  orderCount: number
  totalRefunded: number
  defaultPaymentMethod: string | null
  address: object | null
  isGuest: boolean
}
