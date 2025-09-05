'use client'

import { useState, useEffect } from 'react'
import { Customer, Order } from '../admin.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  RefreshCw, 
  ArrowUpDown, 
  Users, 
  User, 
  Mail, 
  Phone, 
  MoreHorizontal, 
  RotateCcw 
} from 'lucide-react'
import { filterCustomers, sortCustomers, getCustomerStats, formatCurrency, formatDate } from '../utils/customerUtils'
import { CustomerStatsCards } from './CustomerStatsCards'
import { CustomerDetailsModal } from './CustomerDetailsModal'

interface StripeOrder {
  id: string
  customerEmail: string
  customerName: string
  customerPhone?: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentIntentId: string
  createdAt: string
}

interface CustomerListProps {
  customers: Customer[]
  orders: Order[]
  onRefresh: () => void
  onRefundOrder: (orderId: string, paymentIntentId: string) => void
  fetchStripeOrders: () => Promise<StripeOrder[]>
}

export function CustomerList({ customers, orders, onRefresh, onRefundOrder, fetchStripeOrders }: CustomerListProps) {
  const [stripeOrders, setStripeOrders] = useState<StripeOrder[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<'name' | 'email' | 'created' | 'totalSpent' | 'orderCount'>('created')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false)

  // Load Stripe orders for refund matching
  useEffect(() => {
    const loadStripeOrders = async () => {
      const orders = await fetchStripeOrders()
      setStripeOrders(orders)
    }
    loadStripeOrders()
  }, [fetchStripeOrders])

  const handleViewCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerDetailsOpen(true)
  }


  const getCustomerStripeOrders = (customer: Customer) => {
    return stripeOrders.filter(order => 
      order.customerEmail === customer.email ||
      (customer.isGuest && order.customerName === customer.name)
    )
  }

  const handleRefundCustomerOrder = (customer: Customer) => {
    const customerStripeOrders = getCustomerStripeOrders(customer)
    if (customerStripeOrders.length > 0) {
      // For simplicity, refund the most recent order
      const mostRecentOrder = customerStripeOrders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]
      onRefundOrder(mostRecentOrder.id, mostRecentOrder.paymentIntentId)
    }
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const filteredCustomers = filterCustomers(customers, searchQuery)
  const sortedCustomers = sortCustomers(filteredCustomers, sortField, sortDirection)
  const stats = getCustomerStats(customers)

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">
            View and manage customer information
          </p>
        </div>
        <Button onClick={onRefresh} variant="outline" className="self-start sm:self-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <CustomerStatsCards stats={stats} />

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={sortField === 'created' ? 'default' : 'outline'}
            onClick={() => handleSort('created')}
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            Date {sortField === 'created' && (sortDirection === 'desc' ? '↓' : '↑')}
          </Button>
          <Button
            variant={sortField === 'totalSpent' ? 'default' : 'outline'}
            onClick={() => handleSort('totalSpent')}
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            Spent {sortField === 'totalSpent' && (sortDirection === 'desc' ? '↓' : '↑')}
          </Button>
          <Button
            variant={sortField === 'orderCount' ? 'default' : 'outline'}
            onClick={() => handleSort('orderCount')}
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            Orders {sortField === 'orderCount' && (sortDirection === 'desc' ? '↓' : '↑')}
          </Button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Customer Table */}
      {sortedCustomers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-semibold mb-2">No customers found</h2>
            <p className="text-muted-foreground">
              {searchQuery
                ? 'Try adjusting your search criteria.'
                : 'Customers will appear here once they make purchases.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-2 sm:p-4 font-medium">Customer</th>
                    <th className="text-left p-2 sm:p-4 font-medium hidden sm:table-cell">Contact</th>
                    <th className="text-left p-2 sm:p-4 font-medium">Total Spent</th>
                    <th className="text-left p-2 sm:p-4 font-medium hidden md:table-cell">Orders</th>
                    <th className="text-left p-2 sm:p-4 font-medium hidden lg:table-cell">Customer Since</th>
                    <th className="text-left p-2 sm:p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 sm:p-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <span className="font-medium truncate">{customer.name}</span>
                              {customer.isGuest && (
                                <Badge variant="secondary" className="text-xs self-start">
                                  Guest
                                </Badge>
                              )}
                            </div>
                            {/* Show contact info on mobile when contact column is hidden */}
                            <div className="sm:hidden text-xs text-muted-foreground mt-1">
                              {customer.email}
                              {customer.phone && <div>{customer.phone}</div>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-2 sm:p-4 hidden sm:table-cell">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 mb-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-2 sm:p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-green-600">
                            {formatCurrency(customer.totalSpent)}
                          </span>
                          {/* Show order count on mobile when orders column is hidden */}
                          <span className="md:hidden text-xs text-muted-foreground">
                            {customer.orderCount} orders
                          </span>
                        </div>
                      </td>
                      <td className="p-2 sm:p-4 hidden md:table-cell">
                        <span className="font-medium">{customer.orderCount}</span>
                      </td>
                      <td className="p-2 sm:p-4 hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(customer.created)}
                        </span>
                      </td>
                      <td className="p-2 sm:p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCustomerDetails(customer)}>
                              <User className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {getCustomerStripeOrders(customer).length > 0 && (
                              <DropdownMenuItem onClick={() => handleRefundCustomerOrder(customer)}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Refund Latest Order
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        customer={selectedCustomer}
        open={customerDetailsOpen}
        onOpenChange={setCustomerDetailsOpen}
      />
    </>
  )
}
