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

export class GitHubGistStorage {
  private gistId: string
  private token: string

  constructor(gistId: string, token: string) {
    this.gistId = gistId
    this.token = token
  }

  private ordersCache: { data: Order[]; timestamp: number } | null = null
  private readonly CACHE_TTL = 30000 // 30 seconds

  async getOrders(): Promise<Order[]> {
    // Return cached data if still valid
    if (this.ordersCache && Date.now() - this.ordersCache.timestamp < this.CACHE_TTL) {
      return this.ordersCache.data
    }

    try {
      // Option 1: Fetch only orders.json file directly (if GitHub supported it)
      // Unfortunately GitHub Gist API doesn't support fetching individual files
      
      // Option 2: Use conditional requests with ETag/If-None-Match
      const headers: Record<string, string> = {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      }

      // Add ETag for conditional requests if we have it cached
      if (this.ordersCache && (this.ordersCache as any).etag) {
        headers['If-None-Match'] = (this.ordersCache as any).etag
      }

      const response = await fetch(
        `https://api.github.com/gists/${this.gistId}`,
        { headers }
      )

      // If 304 Not Modified, return cached data
      if (response.status === 304 && this.ordersCache) {
        return this.ordersCache.data
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`)
      }

      const gist = await response.json()
      const ordersFile = gist.files['orders.json']

      if (!ordersFile?.content?.trim()) {
        const emptyResult: Order[] = []
        this.ordersCache = {
          data: emptyResult,
          timestamp: Date.now(),
          etag: response.headers.get('etag')
        } as any
        return emptyResult
      }

      try {
        const orders = JSON.parse(ordersFile.content)
        
        // Cache the result with ETag for next request
        this.ordersCache = {
          data: orders,
          timestamp: Date.now(),
          etag: response.headers.get('etag')
        } as any
        
        return orders
      } catch (parseError) {
        console.error('Error parsing orders.json:', parseError)
        return []
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      // Return cached data if available, even if stale
      return this.ordersCache?.data || []
    }
  }

  async saveOrder(order: Order): Promise<void> {
    const orders = await this.getOrders()
    
    // Check if order already exists by ID or paymentIntentId to prevent duplicates
    const existingIndex = orders.findIndex(o => 
      o.id === order.id || 
      (o.paymentIntentId && order.paymentIntentId && o.paymentIntentId === order.paymentIntentId)
    )
    
    if (existingIndex >= 0) {
      // Update existing order, keeping the original ID
      const existingOrder = orders[existingIndex]
      orders[existingIndex] = {
        ...order,
        id: existingOrder.id // Preserve the original ID to maintain consistency
      }
      console.log(`📝 Updated existing order: ${existingOrder.id} (paymentIntent: ${order.paymentIntentId})`)
    } else {
      // Add new order
      orders.push(order)
      console.log(`➕ Added new order: ${order.id} (paymentIntent: ${order.paymentIntentId})`)
    }

    await this.saveOrdersBatch(orders)
  }

  async saveOrdersBatch(orders: Order[]): Promise<void> {
    // Add retry logic for 409 conflicts
    const maxRetries = 3
    let retryCount = 0
    
    while (retryCount < maxRetries) {
      try {
        const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
          body: JSON.stringify({
            files: {
              'orders.json': {
                content: JSON.stringify(orders, null, 2)
              }
            }
          })
        })

        if (response.ok) {
          // Clear cache after successful update
          this.ordersCache = null
          return
        }

        if (response.status === 409 && retryCount < maxRetries - 1) {
          // Conflict - wait and retry with fresh data
          retryCount++
          console.log(`Gist update conflict, retrying (${retryCount}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
          
          // Refresh orders and retry
          this.ordersCache = null
          const freshOrders = await this.getOrders()
          
          // Re-merge the new orders with fresh data
          const orderMap = new Map(freshOrders.map(o => [o.id, o]))
          orders.forEach(order => orderMap.set(order.id, order))
          orders = Array.from(orderMap.values())
          
          continue
        }

        const errorData = await response.json()
        throw new Error(
          `Failed to save orders: ${response.status} - ${
            errorData.message || 'Unknown error'
          }`
        )
      } catch (error) {
        if (retryCount === maxRetries - 1) {
          throw error
        }
        retryCount++
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      }
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: Order['status']
  ): Promise<void> {
    try {
      const orders = await this.getOrders()
      const updatedOrders = orders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )

      await fetch(`https://api.github.com/gists/${this.gistId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            'orders.json': {
              content: JSON.stringify(updatedOrders, null, 2),
            },
          },
        }),
      })
    } catch (error) {
      console.error('Error updating order status:', error)
      throw error
    }
  }

  async updateHerbsInGist(herbsData: unknown[]): Promise<void> {
    try {
      console.log(
        `Updating herbs data in gist with ${herbsData.length} herbs...`
      )

      const response = await fetch(
        `https://api.github.com/gists/${this.gistId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            files: {
              'herbs-data.json': {
                content: JSON.stringify(herbsData, null, 2),
              },
            },
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          `Failed to update herbs data: ${response.status} - ${errorData.message}`
        )
      }

      console.log('✅ Herbs data successfully updated in GitHub Gist')
    } catch (error) {
      console.error('❌ Error updating herbs data in gist:', error)
      throw error
    }
  }

  async getHerbsFromGist(): Promise<unknown[]> {
    try {
      const response = await fetch(
        `https://api.github.com/gists/${this.gistId}`,
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch herbs data')
      }

      const gist = await response.json()
      const herbsFile = gist.files['herbs-data.json']

      if (!herbsFile) {
        return []
      }

      return JSON.parse(herbsFile.content)
    } catch (error) {
      console.error('Error fetching herbs data:', error)
      return []
    }
  }
}
