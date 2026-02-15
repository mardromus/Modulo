import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/merchants/:id/audit — Aggregate audit trail
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: merchantId } = await params

        // Fetch recent activities from different tables
        const [products, orders, transactions] = await Promise.all([
            prisma.product.findMany({
                where: { merchantId },
                orderBy: { createdAt: 'desc' },
                take: 20
            }),
            prisma.order.findMany({
                where: { merchantId },
                orderBy: { createdAt: 'desc' },
                take: 20,
                include: { product: true }
            }),
            prisma.transaction.findMany({
                where: { run: { order: { merchantId } } },
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: { run: { include: { order: true } } }
            })
        ])

        // Normalize into a single Event stream
        const events = [
            ...products.map(p => ({
                id: `prod_${p.id}`,
                type: 'PRODUCT_EXECUTION',
                timestamp: p.createdAt,
                title: 'Contract Deployed',
                description: `Created split contract for "${p.name}"`,
                amount: p.priceAmount,
                status: 'confirmed',
                hash: null
            })),
            ...orders.map(o => ({
                id: `ord_${o.id}`,
                type: 'ORDER_INGESTION',
                timestamp: o.createdAt,
                title: 'Order Received',
                description: `Incoming payment for "${o.product?.name || 'Unknown'}"`,
                amount: o.amount,
                status: o.status,
                hash: null
            })),
            ...transactions.map(t => ({
                id: `tx_${t.id}`,
                type: 'FUND_DISTRIBUTION',
                timestamp: t.createdAt,
                title: 'Split Executed',
                description: `Disbursed to ${t.toAddress.slice(0, 6)}...${t.toAddress.slice(-4)}`,
                amount: (Number(t.amount) / 1000000).toString(), // Convert back to standard unit for display if needed
                status: t.status,
                hash: t.txHash
            }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        return NextResponse.json({ events })
    } catch (error) {
        console.error('[Audit] Error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch audit logs' },
            { status: 500 }
        )
    }
}
