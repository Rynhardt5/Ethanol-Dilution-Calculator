import { NextRequest, NextResponse } from 'next/server'
import { HerbEnrichmentService } from '@/lib/herb-enrichment'
import { HerbsDatabase } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { id, common_name, latin_name, medicinal_actions } =
      await request.json()

    if (!common_name || !latin_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get full herb data from database if ID provided
    const herbData = {
      id,
      common_name,
      latin_name,
      medicinal_actions: medicinal_actions || [],
      family: undefined,
      botanical_info: undefined,
    }

    if (id) {
      const fullHerbData = await HerbsDatabase.getHerbById(id)
      if (fullHerbData) {
        herbData.family = fullHerbData.family
        herbData.botanical_info = fullHerbData.botanical_info
      }
    }

    const enrichedData = await HerbEnrichmentService.enrichHerbData(herbData)

    return NextResponse.json(enrichedData)
  } catch (error) {
    console.error('Herb enrichment error:', error)
    return NextResponse.json(
      { error: 'Failed to enrich herb data' },
      { status: 500 }
    )
  }
}
