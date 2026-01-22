import { NextRequest, NextResponse } from 'next/server'

export interface PromoCode {
  id: string
  code: string
  discountPercentage: number
  active: boolean
  createdAt: string
  usageCount: number
  maxUsages?: number
  expiresAt?: string
}

const promoCodes: PromoCode[] = []

export async function GET() {
  return NextResponse.json({ promoCodes })
}

export async function POST(request: NextRequest) {
  try {
    const { code, discountPercentage, maxUsages, expiresAt } =
      await request.json()

    if (!code || typeof discountPercentage !== 'number') {
      return NextResponse.json(
        { error: 'Code and discount percentage are required' },
        { status: 400 },
      )
    }

    if (discountPercentage < 1 || discountPercentage > 100) {
      return NextResponse.json(
        { error: 'Discount percentage must be between 1 and 100' },
        { status: 400 },
      )
    }

    const normalizedCode = code.toUpperCase().trim()

    if (promoCodes.some((pc) => pc.code === normalizedCode)) {
      return NextResponse.json(
        { error: 'Promo code already exists' },
        { status: 400 },
      )
    }

    const newPromoCode: PromoCode = {
      id: Date.now().toString(),
      code: normalizedCode,
      discountPercentage,
      active: true,
      createdAt: new Date().toISOString(),
      usageCount: 0,
      maxUsages,
      expiresAt,
    }

    promoCodes.push(newPromoCode)

    return NextResponse.json({ promoCode: newPromoCode }, { status: 201 })
  } catch (error) {
    console.error('Error creating promo code:', error)
    return NextResponse.json(
      { error: 'Failed to create promo code' },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, active } = await request.json()

    const promoCode = promoCodes.find((pc) => pc.id === id)

    if (!promoCode) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 },
      )
    }

    promoCode.active = active

    return NextResponse.json({ promoCode })
  } catch (error) {
    console.error('Error updating promo code:', error)
    return NextResponse.json(
      { error: 'Failed to update promo code' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Promo code ID is required' },
        { status: 400 },
      )
    }

    const index = promoCodes.findIndex((pc) => pc.id === id)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 },
      )
    }

    promoCodes.splice(index, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting promo code:', error)
    return NextResponse.json(
      { error: 'Failed to delete promo code' },
      { status: 500 },
    )
  }
}
