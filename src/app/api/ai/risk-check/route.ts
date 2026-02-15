import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { assessRisk } from '@agents/fraud-sentinel'

/**
 * POST /api/ai/risk-check — Pre-settlement fraud assessment
 *
 * Body: { orderId: string }
 */
export async function POST(request: NextRequest) {
    try {
        const { orderId } = await request.json()

        if (!orderId) {
            return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { product: true },
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Get wallet history for risk analysis
        const walletOrders = order.customerWallet
            ? await prisma.order.findMany({
                where: { customerWallet: order.customerWallet },
                orderBy: { createdAt: 'desc' },
                take: 50,
            })
            : []

        // Estimate wallet age (first order date)
        const firstOrder = walletOrders[walletOrders.length - 1]
        const walletAgeDays = firstOrder
            ? (Date.now() - new Date(firstOrder.createdAt).getTime()) / (24 * 60 * 60 * 1000)
            : 0

        const assessment = assessRisk(
            orderId,
            parseFloat(order.amount),
            order.customerWallet || '0x0',
            walletOrders.map((o) => ({
                createdAt: o.createdAt,
                amount: o.amount,
                status: o.status,
            })),
            walletAgeDays
        )

        return NextResponse.json(assessment)
    } catch (error) {
        console.error('[AI/Risk] Error:', error)
        return NextResponse.json(
            { error: 'Risk assessment failed', details: String(error) },
            { status: 500 }
        )
    }
}
