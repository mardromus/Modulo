import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createMerchantSchema = z.object({
    name: z.string().min(1),
    ownerUserId: z.string(),
    sponsorWallet: z.string().optional(),
})

// POST /api/merchants — Create a new merchant
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const data = createMerchantSchema.parse(body)

        const merchant = await prisma.merchant.create({
            data: {
                name: data.name,
                owner: {
                    connectOrCreate: {
                        where: { id: data.ownerUserId },
                        create: {
                            id: data.ownerUserId,
                            privyId: data.ownerUserId,
                            email: "", // specific email not passed here, simpler to just link ID
                        }
                    }
                },
                sponsorWallet: data.sponsorWallet || null,
            },
        })

        return NextResponse.json({ success: true, merchant }, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.message },
                { status: 400 }
            )
        }
        console.error('[Merchants] Create error:', error)
        return NextResponse.json(
            { error: 'Failed to create merchant' },
            { status: 500 }
        )
    }
}

// GET /api/merchants — List merchants for a specific user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const privyId = searchParams.get('privyId')

        if (!privyId) {
            return NextResponse.json(
                { error: 'privyId is required' },
                { status: 400 }
            )
        }

        const merchants = await prisma.merchant.findMany({
            where: { ownerUserId: privyId },
            include: {
                products: true,
                _count: { select: { orders: true } },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ merchants })
    } catch (error) {
        console.error('[Merchants] List error:', error)
        return NextResponse.json(
            { error: 'Failed to list merchants' },
            { status: 500 }
        )
    }
}
