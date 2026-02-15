import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { explorerTxUrl } from '@/lib/tempo'

// GET /api/orders/:id/status — Get order status with transaction details
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                product: true,
                merchant: true,
                nettingRuns: {
                    include: {
                        transactions: true,
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        })

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }

        const splitRules = JSON.parse(order.product.splitJson)

        return NextResponse.json({
            order: {
                id: order.id,
                status: order.status,
                amount: order.amount,
                currency: order.currency,
                createdAt: order.createdAt,
                product: {
                    name: order.product.name,
                    splitRules,
                },
                merchant: {
                    name: order.merchant.name,
                },
                runs: order.nettingRuns.map((run) => ({
                    id: run.id,
                    status: run.status,
                    createdAt: run.createdAt,
                    transactions: run.transactions.map((tx) => ({
                        id: tx.id,
                        to: tx.toAddress,
                        amount: tx.amount,
                        token: tx.token,
                        txHash: tx.txHash,
                        memo: tx.memo,
                        status: tx.status,
                        explorerUrl: tx.txHash ? explorerTxUrl(tx.txHash) : null,
                    })),
                })),
            },
        })
    } catch (error) {
        console.error('[Orders] Status error:', error)
        return NextResponse.json(
            { error: 'Failed to get order status' },
            { status: 500 }
        )
    }
}
