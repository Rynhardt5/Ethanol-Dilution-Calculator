import { NextRequest, NextResponse } from 'next/server'
import { GitHubGistStorage } from '@/lib/github-gist'

export async function GET() {
  try {
    if (!process.env.GITHUB_GIST_ID || !process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { error: 'GitHub Gist configuration not found' },
        { status: 500 }
      )
    }

    const gistStorage = new GitHubGistStorage(
      process.env.GITHUB_GIST_ID,
      process.env.GITHUB_TOKEN
    )

    const orders = await gistStorage.getOrders()
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!process.env.GITHUB_GIST_ID || !process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { error: 'GitHub Gist configuration not found' },
        { status: 500 }
      )
    }

    const { orderId, status } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      )
    }

    const gistStorage = new GitHubGistStorage(
      process.env.GITHUB_GIST_ID,
      process.env.GITHUB_TOKEN
    )

    await gistStorage.updateOrderStatus(orderId, status)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}
