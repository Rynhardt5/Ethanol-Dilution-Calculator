import { NextRequest, NextResponse } from 'next/server'
import { GitHubGistStorage } from '@/lib/github-gist'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // Get environment variables
    const gistId = process.env.GITHUB_GIST_ID
    const token = process.env.GITHUB_TOKEN

    if (!gistId || !token) {
      return NextResponse.json(
        { error: 'GitHub Gist ID and Token are required in environment variables' },
        { status: 400 }
      )
    }

    // Initialize GitHub Gist storage
    const gistStorage = new GitHubGistStorage(gistId, token)

    // Load merged herbs data
    const herbsDataPath = path.join(process.cwd(), 'herbs-data-merged.json')
    
    let herbsData: unknown[]
    try {
      const fileContent = await fs.readFile(herbsDataPath, 'utf8')
      herbsData = JSON.parse(fileContent)
    } catch (error) {
      console.error('Error loading herbs data:', error)
      return NextResponse.json(
        { error: 'Failed to load merged herbs data file' },
        { status: 500 }
      )
    }

    // Upload to GitHub Gist
    await gistStorage.updateHerbsInGist(herbsData)

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${herbsData.length} herbs to GitHub Gist`,
      totalHerbs: herbsData.length,
      gistId: gistId
    })

  } catch (error) {
    console.error('Error uploading herbs to gist:', error)
    return NextResponse.json(
      { error: 'Failed to upload herbs data to GitHub Gist' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get environment variables
    const gistId = process.env.GITHUB_GIST_ID
    const token = process.env.GITHUB_TOKEN

    if (!gistId || !token) {
      return NextResponse.json(
        { error: 'GitHub Gist ID and Token are required in environment variables' },
        { status: 400 }
      )
    }

    // Initialize GitHub Gist storage
    const gistStorage = new GitHubGistStorage(gistId, token)

    // Get current herbs data from gist
    const herbsData = await gistStorage.getHerbsFromGist()

    return NextResponse.json({
      success: true,
      totalHerbs: herbsData.length,
      gistId: gistId,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching herbs from gist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch herbs data from GitHub Gist' },
      { status: 500 }
    )
  }
}
