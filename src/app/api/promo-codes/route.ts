import { NextRequest, NextResponse } from 'next/server'
import { GitHubGistStorage, PromoCode } from '@/lib/github-gist'

function getGistStorage() {
  if (!process.env.GITHUB_GIST_ID || !process.env.GITHUB_TOKEN) {
    throw new Error('GitHub Gist configuration not found')
  }
  return new GitHubGistStorage(process.env.GITHUB_GIST_ID, process.env.GITHUB_TOKEN)
}

export async function GET() {
  try {
    const gistStorage = getGistStorage()
    const promoCodes = await gistStorage.getPromoCodes()
    return NextResponse.json({ promoCodes })
  } catch (error) {
    console.error('Error fetching promo codes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promo codes' },
      { status: 500 }
    )
  }
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
    const gistStorage = getGistStorage()
    const promoCodes = await gistStorage.getPromoCodes()

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

    await gistStorage.savePromoCode(newPromoCode)

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
    const gistStorage = getGistStorage()
    const promoCodes = await gistStorage.getPromoCodes()

    const promoCode = promoCodes.find((pc) => pc.id === id)

    if (!promoCode) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 },
      )
    }

    await gistStorage.updatePromoCodeStatus(id, active)
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

    const gistStorage = getGistStorage()
    const promoCodes = await gistStorage.getPromoCodes()

    const index = promoCodes.findIndex((pc) => pc.id === id)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 },
      )
    }

    await gistStorage.deletePromoCode(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting promo code:', error)
    return NextResponse.json(
      { error: 'Failed to delete promo code' },
      { status: 500 },
    )
  }
}
