import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Promo code is required' },
        { status: 400 },
      )
    }

    const normalizedCode = code.toUpperCase().trim()

    const promoCodesResponse = await fetch(
      `${request.nextUrl.origin}/api/promo-codes`,
      { cache: 'no-store' },
    )
    const { promoCodes } = await promoCodesResponse.json()

    const promoCode = promoCodes.find(
      (pc: { code: string; active: boolean }) =>
        pc.code === normalizedCode && pc.active,
    )

    if (!promoCode) {
      return NextResponse.json(
        { error: 'Invalid or inactive promo code' },
        { status: 404 },
      )
    }

    if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Promo code has expired' },
        { status: 400 },
      )
    }

    if (promoCode.maxUsages && promoCode.usageCount >= promoCode.maxUsages) {
      return NextResponse.json(
        { error: 'Promo code usage limit reached' },
        { status: 400 },
      )
    }

    return NextResponse.json({
      valid: true,
      discountPercentage: promoCode.discountPercentage,
      code: promoCode.code,
    })
  } catch (error) {
    console.error('Error validating promo code:', error)
    return NextResponse.json(
      { error: 'Failed to validate promo code' },
      { status: 500 },
    )
  }
}
