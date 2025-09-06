import { NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET() {
  try {
    const query = `
      SELECT DISTINCT name 
      FROM medicinal_actions 
      ORDER BY name
    `
    
    const result = await db.query(query)
    const actions = result.rows.map(row => row.name)
    
    return NextResponse.json(actions)
  } catch (error) {
    console.error('Error fetching medicinal actions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medicinal actions' },
      { status: 500 }
    )
  }
}
