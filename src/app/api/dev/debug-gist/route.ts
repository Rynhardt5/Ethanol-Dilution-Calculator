import { NextResponse } from 'next/server'
import { GitHubGistStorage } from '@/lib/github-gist'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'This endpoint is only available in development' }, { status: 403 })
  }

  try {
    if (!process.env.GITHUB_GIST_ID || !process.env.GITHUB_TOKEN) {
      return NextResponse.json({ error: 'GitHub Gist configuration missing' }, { status: 500 })
    }

    const gistStorage = new GitHubGistStorage(
      process.env.GITHUB_GIST_ID,
      process.env.GITHUB_TOKEN
    )

    const orders = await gistStorage.getOrders()
    
    return NextResponse.json({ 
      ordersCount: orders.length,
      orders: orders.slice(0, 5), // Show first 5 orders for debugging
      gistId: process.env.GITHUB_GIST_ID
    })

  } catch (error) {
    console.error('Error fetching orders from Gist:', error)
    return NextResponse.json({ error: 'Failed to fetch orders from Gist' }, { status: 500 })
  }
}
