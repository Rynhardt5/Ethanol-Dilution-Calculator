import { NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET() {
  try {
    const query = `
      SELECT DISTINCT name 
      FROM preparations 
      ORDER BY name
    `
    
    const result = await db.query(query)
    const preparations = result.rows.map(row => row.name)
    
    return NextResponse.json(preparations)
  } catch (error) {
    console.error('Error fetching preparations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preparations' },
      { status: 500 }
    )
  }
}
