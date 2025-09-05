'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Lock,
  Loader2,
  RefreshCw,
  Search,
  Package,
  CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'

// Import our new reusable components and hooks
import { useAdminData } from './hooks/useAdminData'
import { filterOrders, getOrderStats } from './utils/orderUtils'
import { OrderCard } from './components/OrderCard'
import { StatsCards } from './components/StatsCards'
import { AdminSidebar, MobileHeader } from './components/AdminSidebar'
import { CustomerList } from './components/CustomerList'
import { ProductList } from './components/ProductList'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [password, setPassword] = useState('')
  const [loginAttempting, setLoginAttempting] = useState(false)
  const [activeSection, setActiveSection] = useState<
    'orders' | 'customers' | 'products'
  >('orders')
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Use our custom hook for data management
  const {
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
  } = useAdminData()

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated, fetchData])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginAttempting(true)

    if (password === 'Luna098!') {
      setIsAuthenticated(true)
      toast.success('Access granted!')
    } else {
      toast.error('Invalid password')
      setPassword('')
    }

    setLoginAttempting(false)
  }

  // Use utility functions
  const filteredOrders = filterOrders(orders, activeTab, searchQuery)
  const stats = getOrderStats(orders)

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="flex-1 p-6">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Admin Access Required
                </CardTitle>
                <CardDescription>
                  Please enter the admin password to continue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter admin password"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginAttempting}
                  >
                    {loginAttempting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Access Admin Panel'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSidebar
          activeSection={activeSection}
          sidebarOpen={sidebarOpen}
          onSectionChange={setActiveSection}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <MobileHeader
          activeSection={activeSection}
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <div className="lg:ml-64 p-4 lg:p-6">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading data...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        activeSection={activeSection}
        sidebarOpen={sidebarOpen}
        onSectionChange={setActiveSection}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <MobileHeader
        activeSection={activeSection}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <div className="p-4 lg:p-6 lg:ml-64">
        <div className="max-w-6xl mx-auto space-y-6">
          {activeSection === 'orders' && (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    Order Management
                  </h1>
                  <p className="text-muted-foreground">
                    Manage customer orders and fulfillment
                  </p>
                </div>
                <Button
                  onClick={fetchData}
                  variant="outline"
                  className="self-start sm:self-auto"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {/* Stats Cards */}
              <StatsCards stats={stats} />

              {/* Tabs and Search */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant={activeTab === 'pending' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('pending')}
                    className="flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    Pending ({stats.pending})
                  </Button>
                  <Button
                    variant={activeTab === 'completed' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('completed')}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Completed ({stats.completed})
                  </Button>
                </div>

                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders by name, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h2 className="text-2xl font-semibold mb-2">
                      No orders found
                    </h2>
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? 'Try adjusting your search criteria.'
                        : 'Orders will appear here once customers make purchases.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      updating={updating}
                      refunding={refunding}
                      onUpdateStatus={updateOrderStatus}
                      onRefund={refundOrder}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeSection === 'customers' && (
            <CustomerList
              customers={customers}
              orders={orders}
              onRefresh={fetchData}
              onRefundOrder={refundOrder}
              fetchStripeOrders={fetchStripeOrders}
            />
          )}

          {activeSection === 'products' && (
            <ProductList products={products} onRefresh={fetchData} />
          )}
        </div>
      </div>
    </div>
  )
}
