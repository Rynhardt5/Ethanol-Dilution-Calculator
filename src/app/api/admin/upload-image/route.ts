import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Stripe with 'dispute_evidence' purpose which allows any aspect ratio
    const stripeFile = await stripe.files.create({
      file: {
        data: buffer,
        name: file.name,
        type: 'application/octet-stream',
      },
      purpose: 'dispute_evidence', // This purpose allows any aspect ratio
    })

    return NextResponse.json({
      fileUrl: stripeFile.url,
      fileId: stripeFile.id,
    })
  } catch (error) {
    console.error('Error uploading file to Stripe:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
