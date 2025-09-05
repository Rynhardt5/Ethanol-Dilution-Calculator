import { Order } from '../admin.types'
import { toast } from 'sonner'

export const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'collected':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'shipped':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export const getStatusIcon = (status: string) => {
  const iconClasses = 'h-4 w-4'

  switch (status) {
    case 'pending':
      return { icon: 'Package', className: iconClasses }
    case 'collected':
      return { icon: 'CheckCircle', className: iconClasses }
    case 'shipped':
      return { icon: 'Truck', className: iconClasses }
    default:
      return { icon: 'Package', className: iconClasses }
  }
}

export const filterOrders = (
  orders: Order[],
  activeTab: 'pending' | 'completed',
  searchQuery: string
) => {
  return orders.filter((order) => {
    // Tab filtering
    const tabMatch =
      activeTab === 'pending'
        ? order.status === 'pending'
        : order.status === 'collected' || order.status === 'shipped'

    // Search filtering
    const searchMatch =
      searchQuery === '' ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customerPhone && order.customerPhone.includes(searchQuery))

    return tabMatch && searchMatch
  })
}

export const getOrderStats = (orders: Order[]) => {
  const pending = orders.filter((order) => order.status === 'pending')
  const collected = orders.filter((order) => order.status === 'collected')
  const shipped = orders.filter((order) => order.status === 'shipped')

  return {
    total: orders.length,
    pending: pending.length,
    collected: collected.length,
    shipped: shipped.length,
    completed: collected.length + shipped.length,
  }
}

export const copyAddressToClipboard = (order: Order) => {
  if (!order.shippingAddress) return

  const addressText = [
    order.customerName,
    order.shippingAddress.line1,
    order.shippingAddress.line2,
    `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postal_code}`,
    order.shippingAddress.country,
    order.customerPhone ? `Phone: ${order.customerPhone}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  navigator.clipboard.writeText(addressText)
  toast.success('Address copied to clipboard!')
}

export const formatCurrency = (amount: number) => {
  return `$${(amount / 100).toFixed(2)}`
}
