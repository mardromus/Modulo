import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSponsorAddress, ALPHA_USD, explorerTxUrl, explorerAddressUrl } from '@/lib/tempo'

// GET /api/admin/sponsor/status — Get sponsor wallet status
export async function GET() {
    try {
        const sponsorAddress = getSponsorAddress()

        // Get order stats from DB
        const [totalOrders, settledOrders, failedOrders, pendingOrders] =
            await Promise.all([
                prisma.order.count(),
                prisma.order.count({ where: { status: 'settled' } }),
                prisma.order.count({ where: { status: 'failed' } }),
                prisma.order.count({ where: { status: 'pending' } }),
            ])

        // Get recent transactions
        const recentTxs = await prisma.transaction.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { run: { include: { order: true } } },
        })

        return NextResponse.json({
            sponsor: {
                address: sponsorAddress,
                explorerUrl: explorerAddressUrl(sponsorAddress),
                feeToken: ALPHA_USD,
            },
            stats: {
                totalOrders,
                settledOrders,
                failedOrders,
                pendingOrders,
            },
            recentTransactions: recentTxs.map((tx) => ({
                id: tx.id,
                to: tx.toAddress,
                amount: tx.amount,
                txHash: tx.txHash,
                memo: tx.memo,
                status: tx.status,
                orderId: tx.run.orderId,
                explorerUrl: tx.txHash ? explorerTxUrl(tx.txHash) : null,
                createdAt: tx.createdAt,
            })),
        })
    } catch (error) {
        console.error('[Admin] Sponsor status error:', error)
        return NextResponse.json(
            { error: 'Failed to get sponsor status' },
            { status: 500 }
        )
    }
}
