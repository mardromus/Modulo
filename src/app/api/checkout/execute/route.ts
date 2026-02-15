import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { executeSmartSplit, type SplitRule } from '@agents/smart-split'
import { ALPHA_USD, explorerTxUrl } from '@/lib/tempo'
import { parseUnits } from 'viem'

// POST /api/checkout/execute — Execute the SmartSplit for an order
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { orderId } = body

        if (!orderId) {
            return NextResponse.json(
                { error: 'orderId is required' },
                { status: 400 }
            )
        }

        // Fetch order with product
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { product: true, merchant: true },
        })

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }

        if (order.status !== 'pending') {
            return NextResponse.json(
                { error: `Order already ${order.status}` },
                { status: 400 }
            )
        }

        // Update order status
        await prisma.order.update({
            where: { id: orderId },
            data: { status: 'processing' },
        })

        // Parse split rules
        const splitRules: SplitRule[] = JSON.parse(order.product.splitJson)
        const totalAmount = parseUnits(order.amount, 6)

        // Create netting run
        const nettingRun = await prisma.nettingRun.create({
            data: {
                orderId: order.id,
                runPayload: JSON.stringify({
                    splitRules,
                    totalAmount: totalAmount.toString(),
                }),
                status: 'executing',
            },
        })

        // Execute SmartSplit
        const result = await executeSmartSplit(
            orderId,
            totalAmount,
            splitRules,
            ALPHA_USD
        )

        if (result.success) {
            // Store transactions in DB
            for (const split of result.splits) {
                await prisma.transaction.create({
                    data: {
                        runId: nettingRun.id,
                        fromAddress: order.merchant.sponsorWallet || 'sponsor',
                        toAddress: split.to,
                        amount: split.amount.toString(),
                        token: ALPHA_USD,
                        txHash: result.txHash || null,
                        memo: `order:${orderId.slice(0, 8)}:split:v1`,
                        status: 'confirmed',
                    },
                })
            }

            // Update statuses
            await prisma.nettingRun.update({
                where: { id: nettingRun.id },
                data: { status: 'completed' },
            })

            await prisma.order.update({
                where: { id: orderId },
                data: { status: 'settled' },
            })

            return NextResponse.json({
                success: true,
                orderId,
                runId: nettingRun.id,
                txHash: result.txHash,
                explorerUrl: result.explorerUrl,
                splits: result.splits.map((s) => ({
                    to: s.to,
                    amount: s.amount.toString(),
                    label: s.label,
                    percent: s.percent,
                })),
            })
        } else {
            // Mark as failed
            await prisma.nettingRun.update({
                where: { id: nettingRun.id },
                data: { status: 'failed' },
            })

            await prisma.order.update({
                where: { id: orderId },
                data: { status: 'failed' },
            })

            return NextResponse.json(
                {
                    success: false,
                    orderId,
                    error: result.error || 'SmartSplit execution failed',
                },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error('[Checkout] Execute error:', error)
        return NextResponse.json(
            { error: 'Execution failed' },
            { status: 500 }
        )
    }
}
