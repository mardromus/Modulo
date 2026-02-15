import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { explorerTxUrl } from '@/lib/tempo'

/**
 * GET /api/transactions/[txHash] — Transaction detail with explorer link
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ txHash: string }> }
) {
    try {
        const { txHash } = await params

        // Find transactions matching this hash
        const transactions = await prisma.transaction.findMany({
            where: { txHash },
            include: {
                run: {
                    include: {
                        order: {
                            include: { product: true, merchant: true },
                        },
                    },
                },
            },
        })

        if (transactions.length === 0) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
        }

        const tx = transactions[0]
        const order = tx.run.order

        return NextResponse.json({
            txHash,
            explorerUrl: explorerTxUrl(txHash),
            status: tx.status,
            from: tx.fromAddress,
            to: tx.toAddress,
            amount: tx.amount,
            token: tx.token,
            memo: tx.memo,
            createdAt: tx.createdAt,
            order: {
                id: order.id,
                status: order.status,
                amount: order.amount,
                product: order.product.name,
                merchant: order.merchant.name,
            },
            run: {
                id: tx.run.id,
                status: tx.run.status,
                totalTransactions: transactions.length,
            },
        })
    } catch (error) {
        console.error('[Transactions] Detail error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch transaction', details: String(error) },
            { status: 500 }
        )
    }
}
