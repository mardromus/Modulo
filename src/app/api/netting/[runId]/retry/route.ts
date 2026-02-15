import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { executeSmartSplit, type SplitRule } from '@agents/smart-split'
import { ALPHA_USD } from '@/lib/tempo'
import { parseUnits } from 'viem'

/**
 * POST /api/netting/[runId]/retry — Retry failed transfers in a netting run
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ runId: string }> }
) {
    try {
        const { runId } = await params

        const nettingRun = await prisma.nettingRun.findUnique({
            where: { id: runId },
            include: {
                order: { include: { product: true, merchant: true } },
                transactions: true,
            },
        })

        if (!nettingRun) {
            return NextResponse.json({ error: 'Netting run not found' }, { status: 404 })
        }

        if (nettingRun.status === 'completed') {
            return NextResponse.json({
                error: 'Netting run already completed',
                status: nettingRun.status,
            }, { status: 400 })
        }

        // Get failed transactions that need retry
        const failedTxs = nettingRun.transactions.filter((t) => t.status === 'failed')

        if (failedTxs.length === 0) {
            return NextResponse.json({
                message: 'No failed transactions to retry',
                status: nettingRun.status,
            })
        }

        // Mark run as executing
        await prisma.nettingRun.update({
            where: { id: runId },
            data: { status: 'executing' },
        })

        // Re-execute the split
        const splitRules: SplitRule[] = JSON.parse(nettingRun.order.product.splitJson)
        const totalAmount = parseUnits(nettingRun.order.amount, 6)

        const result = await executeSmartSplit(
            nettingRun.orderId,
            totalAmount,
            splitRules,
            ALPHA_USD
        )

        if (result.success) {
            // Update failed transactions
            for (const tx of failedTxs) {
                await prisma.transaction.update({
                    where: { id: tx.id },
                    data: {
                        txHash: result.txHash || null,
                        status: 'confirmed',
                    },
                })
            }

            await prisma.nettingRun.update({
                where: { id: runId },
                data: { status: 'completed' },
            })

            await prisma.order.update({
                where: { id: nettingRun.orderId },
                data: { status: 'settled' },
            })

            return NextResponse.json({
                success: true,
                runId,
                txHash: result.txHash,
                retriedCount: failedTxs.length,
                explorerUrl: result.explorerUrl,
            })
        } else {
            await prisma.nettingRun.update({
                where: { id: runId },
                data: { status: 'failed' },
            })

            return NextResponse.json(
                { success: false, runId, error: result.error },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error('[Netting] Retry error:', error)
        return NextResponse.json(
            { error: 'Retry failed', details: String(error) },
            { status: 500 }
        )
    }
}
