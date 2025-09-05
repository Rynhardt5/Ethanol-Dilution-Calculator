import { Customer } from '../admin.types'

export const filterCustomers = (
  customers: Customer[],
  searchQuery: string
) => {
  if (!searchQuery) return customers
  
  const searchLower = searchQuery.toLowerCase()
  return customers.filter(customer =>
    customer.name.toLowerCase().includes(searchLower) ||
    customer.email.toLowerCase().includes(searchLower) ||
    (customer.phone && customer.phone.includes(searchQuery))
  )
}

export const sortCustomers = (
  customers: Customer[],
  sortField: 'name' | 'email' | 'created' | 'totalSpent' | 'orderCount',
  sortDirection: 'asc' | 'desc'
) => {
  return [...customers].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })
}

export const getCustomerStats = (customers: Customer[]) => {
  const totalCustomers = customers.length
  const guestCustomers = customers.filter(c => c.isGuest).length
  const registeredCustomers = totalCustomers - guestCustomers
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const averageSpent = totalCustomers > 0 ? totalRevenue / totalCustomers : 0

  return {
    total: totalCustomers,
    guests: guestCustomers,
    registered: registeredCustomers,
    totalRevenue,
    averageSpent
  }
}

export const formatCurrency = (amount: number) => {
  return `$${(amount / 100).toFixed(2)}`
}

export const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString()
}
