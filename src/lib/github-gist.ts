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

  async getOrders(): Promise<Order[]> {
    try {
      const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const gist = await response.json()
      const ordersFile = gist.files['orders.json']
      
      if (!ordersFile) {
        return []
      }

      return JSON.parse(ordersFile.content)
    } catch (error) {
      console.error('Error fetching orders:', error)
      return []
    }
  }

  async saveOrder(order: Order): Promise<void> {
    try {
      const orders = await this.getOrders()
      const updatedOrders = [...orders, order]

      await fetch(`https://api.github.com/gists/${this.gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            'orders.json': {
              content: JSON.stringify(updatedOrders, null, 2)
            }
          }
        })
      })
    } catch (error) {
      console.error('Error saving order:', error)
      throw error
    }
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    try {
      const orders = await this.getOrders()
      const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, status } : order
      )

      await fetch(`https://api.github.com/gists/${this.gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            'orders.json': {
              content: JSON.stringify(updatedOrders, null, 2)
            }
          }
        })
      })
    } catch (error) {
      console.error('Error updating order status:', error)
      throw error
    }
  }
}
