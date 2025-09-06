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

  async updateHerbsInGist(herbsData: unknown[]): Promise<void> {
    try {
      console.log(`Updating herbs data in gist with ${herbsData.length} herbs...`)
      
      const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            'herbs-data.json': {
              content: JSON.stringify(herbsData, null, 2)
            }
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to update herbs data: ${response.status} - ${errorData.message}`)
      }

      console.log('✅ Herbs data successfully updated in GitHub Gist')
    } catch (error) {
      console.error('❌ Error updating herbs data in gist:', error)
      throw error
    }
  }

  async getHerbsFromGist(): Promise<unknown[]> {
    try {
      const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      })

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
