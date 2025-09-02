'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Package, Truck, CheckCircle, Loader2, RefreshCw, Lock, MapPin, Search, Phone } from 'lucide-react'
import { toast } from 'sonner'

interface Order {
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

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [loginAttempting, setLoginAttempting] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders()
    }
  }, [isAuthenticated])

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

  const fetchOrders = async () => {
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
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
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

      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status } : order
      ))
      toast.success('Order status updated successfully')
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusColor = (status: Order['status']) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Package className="h-4 w-4" />
      case 'collected':
        return <CheckCircle className="h-4 w-4" />
      case 'shipped':
        return <Truck className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  // Filter orders based on active tab and search query
  const filteredOrders = orders.filter(order => {
    // Tab filtering
    const tabMatch = activeTab === 'pending' 
      ? order.status === 'pending' 
      : order.status === 'collected' || order.status === 'shipped'
    
    // Search filtering
    const searchMatch = searchQuery === '' || 
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customerPhone && order.customerPhone.includes(searchQuery))
    
    return tabMatch && searchMatch
  })

  const pendingOrders = orders.filter(order => order.status === 'pending')
  const collectedOrders = orders.filter(order => order.status === 'collected')
  const shippedOrders = orders.filter(order => order.status === 'shipped')

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-center py-20">
            <Card className="w-full">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Lock className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl font-serif">Admin Access</CardTitle>
                <CardDescription>
                  Enter the admin password to access order management
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
      <div className="min-h-screen bg-background p-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading orders...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-serif">
              Order Management
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage customer orders and fulfillment
            </p>
          </div>
          <Button onClick={fetchOrders} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Collected</p>
                  <p className="text-2xl font-bold">{collectedOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Truck className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Shipped</p>
                  <p className="text-2xl font-bold">{shippedOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'pending' ? 'default' : 'outline'}
              onClick={() => setActiveTab('pending')}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Pending ({pendingOrders.length})
            </Button>
            <Button
              variant={activeTab === 'completed' ? 'default' : 'outline'}
              onClick={() => setActiveTab('completed')}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Completed ({collectedOrders.length + shippedOrders.length})
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
              <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground">
                Orders will appear here once customers make purchases.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {order.customerName}
                      </CardTitle>
                      <CardDescription>
                        {order.customerEmail} • {new Date(order.createdAt).toLocaleDateString()}
                        {order.customerPhone && (
                          <>
                            {' • '}
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {order.customerPhone}
                            </span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Collection Method */}
                  <div>
                    <h4 className="font-semibold mb-2">Collection Method</h4>
                    <div className="flex items-center gap-2">
                      {order.collectionMethod === 'pickup' ? (
                        <>
                          <MapPin className="h-4 w-4 text-primary" />
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Collect in Person
                          </Badge>
                        </>
                      ) : (
                        <>
                          <Truck className="h-4 w-4 text-primary" />
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Ship to Address
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="font-semibold mb-2">Items</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.name} × {item.quantity}</span>
                          <span>${((item.price * item.quantity) / 100).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-2" />
                    {order.collectionMethod === 'shipping' && order.shippingCost && (
                      <div className="flex justify-between text-sm">
                        <span>Shipping</span>
                        <span>${(order.shippingCost / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${(order.totalAmount / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {order.shippingAddress && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Shipping Address
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg border">
                        <div className="text-sm space-y-1">
                          <div className="font-medium">{order.customerName}</div>
                          <div>{order.shippingAddress.line1}</div>
                          {order.shippingAddress.line2 && <div>{order.shippingAddress.line2}</div>}
                          <div>
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postal_code}
                          </div>
                          <div className="font-medium">{order.shippingAddress.country}</div>
                          {order.customerPhone && (
                            <div className="flex items-center gap-1 pt-1 border-t mt-2">
                              <Phone className="h-3 w-3" />
                              <span className="text-xs">{order.customerPhone}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 pt-2 border-t">
                          <button 
                            className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                            onClick={() => {
                              const addressText = [
                                order.customerName,
                                order.shippingAddress?.line1,
                                order.shippingAddress?.line2,
                                `${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.postal_code}`,
                                order.shippingAddress?.country,
                                order.customerPhone ? `Phone: ${order.customerPhone}` : ''
                              ].filter(Boolean).join('\n')
                              
                              navigator.clipboard.writeText(addressText)
                              toast.success('Address copied to clipboard!')
                            }}
                          >
                            📋 Copy Address
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    {order.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'collected')}
                          disabled={updating === order.id}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark as Collected
                        </Button>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'shipped')}
                          disabled={updating === order.id}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Truck className="h-4 w-4" />
                          Mark as Shipped
                        </Button>
                      </>
                    )}
                    {order.status === 'collected' && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, 'pending')}
                        disabled={updating === order.id}
                        variant="outline"
                        size="sm"
                      >
                        Mark as Pending
                      </Button>
                    )}
                    {order.status === 'shipped' && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, 'pending')}
                        disabled={updating === order.id}
                        variant="outline"
                        size="sm"
                      >
                        Mark as Pending
                      </Button>
                    )}
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
