import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { parseMemo } from '@agents/reconciliation'

/**
 * POST /webhooks/tempo/tx — Receive transaction confirmation webhooks
 * 
 * Body: { txHash, from, to, amount, memo, blockNumber }
 * 
 * This endpoint is called when a transfer is confirmed on-chain.
 * It matches the memo to an order and updates the settlement status.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { txHash, from, to, amount, memo, blockNumber } = body

        if (!txHash) {
            return NextResponse.json({ error: 'txHash is required' }, { status: 400 })
        }

        // Idempotency: check if this txHash already processed
        const existing = await prisma.transaction.findFirst({
            where: { txHash, status: 'confirmed' },
        })

        if (existing) {
            return NextResponse.json({
                status: 'already_processed',
                transactionId: existing.id,
                message: 'This transaction has already been reconciled.',
            })
        }

        // Parse memo to find the associated order
        const parsed = memo ? parseMemo(memo) : { type: 'unknown' as const }

        let orderId: string | null = null
        let reconciled = false

        if (parsed.type === 'order' && parsed.orderId) {
            // Match to existing order
            const order = await prisma.order.findFirst({
                where: {
                    id: { startsWith: parsed.orderId },
                },
                include: { nettingRuns: true },
            })

            if (order) {
                orderId = order.id

                // Update order status to settled
                await prisma.order.update({
                    where: { id: order.id },
                    data: { status: 'settled' },
                })

                // Update matching transactions
                if (order.nettingRuns.length > 0) {
                    const latestRun = order.nettingRuns[order.nettingRuns.length - 1]

                    await prisma.transaction.updateMany({
                        where: {
                            runId: latestRun.id,
                            txHash: null,
                        },
                        data: {
                            txHash,
                            status: 'confirmed',
                        },
                    })

                    await prisma.nettingRun.update({
                        where: { id: latestRun.id },
                        data: { status: 'completed' },
                    })
                }

                reconciled = true
            }
        }

        // Log the webhook event for audit
        console.log('[Webhook] TX confirmation:', {
            txHash,
            from,
            to,
            amount,
            memo,
            blockNumber,
            parsedMemo: parsed,
            orderId,
            reconciled,
        })

        return NextResponse.json({
            status: reconciled ? 'reconciled' : 'received',
            orderId,
            txHash,
            memoType: parsed.type,
            message: reconciled
                ? `Order ${orderId} marked as settled.`
                : 'Transaction logged but no matching order found.',
        })
    } catch (error) {
        console.error('[Webhook] TX processing error:', error)
        return NextResponse.json(
            { error: 'Webhook processing failed', details: String(error) },
            { status: 500 }
        )
    }
}
