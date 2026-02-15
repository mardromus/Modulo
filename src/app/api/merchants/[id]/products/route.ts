import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createProductSchema = z.object({
    name: z.string().min(1),
    priceAmount: z.string(),
    currency: z.string().default('AlphaUSD'),
    splitRules: z.array(
        z.object({
            address: z.string(),
            percent: z.number().min(0).max(100),
            label: z.string(),
        })
    ),
})

// POST /api/merchants/:id/products — Create product with split rules
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: merchantId } = await params
        const body = await request.json()
        const data = createProductSchema.parse(body)

        // Validate splits sum to 100
        const totalPercent = data.splitRules.reduce((s, r) => s + r.percent, 0)
        if (Math.abs(totalPercent - 100) > 0.01) {
            return NextResponse.json(
                { error: `Split percentages must sum to 100, got ${totalPercent}` },
                { status: 400 }
            )
        }

        const product = await prisma.product.create({
            data: {
                merchantId,
                name: data.name,
                priceAmount: data.priceAmount,
                currency: data.currency,
                splitJson: JSON.stringify(data.splitRules),
            },
        })

        return NextResponse.json({ success: true, product }, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.message },
                { status: 400 }
            )
        }
        console.error('[Products] Create error:', error)
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 }
        )
    }
}

// GET /api/merchants/:id/products — List products for a merchant
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: merchantId } = await params
        const products = await prisma.product.findMany({
            where: { merchantId },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({
            products: products.map((p) => ({
                ...p,
                splitRules: JSON.parse(p.splitJson),
            })),
        })
    } catch (error) {
        console.error('[Products] List error:', error)
        return NextResponse.json(
            { error: 'Failed to list products' },
            { status: 500 }
        )
    }
}
