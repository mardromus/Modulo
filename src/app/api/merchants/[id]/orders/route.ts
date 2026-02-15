import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/merchants/:id/orders — List orders for a merchant
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: merchantId } = await params

        const orders = await prisma.order.findMany({
            where: { merchantId },
            include: {
                product: true,
                nettingRuns: {
                    include: { transactions: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({
            orders: orders.map((o) => ({
                id: o.id,
                status: o.status,
                amount: o.amount,
                currency: o.currency,
                product: o.product, // Return full product including splitJson
                createdAt: o.createdAt,
                latestRun: o.nettingRuns[0] || null,
            })),
        })
    } catch (error) {
        console.error('[Orders] List error:', error)
        return NextResponse.json(
            { error: 'Failed to list orders' },
            { status: 500 }
        )
    }
}
