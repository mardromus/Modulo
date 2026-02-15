import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { retrySubscriptionPayment, analyzeSubscriptionsWithAI, type Subscription } from '@agents/subscription-guardian'

/**
 * POST /api/subscriptions/retry — Retry a failed subscription payment
 * Body: { subscriptionId: string, backupWallet?: string }
 */
export async function POST(request: NextRequest) {
    try {
        const { subscriptionId, backupWallet } = await request.json()

        if (!subscriptionId) {
            return NextResponse.json({ error: 'subscriptionId is required' }, { status: 400 })
        }

        // Look up the subscription from orders with recurring flag
        const order = await prisma.order.findFirst({
            where: { id: subscriptionId, status: 'failed' },
            include: { product: true, merchant: true },
        })

        if (!order) {
            return NextResponse.json({ error: 'Failed subscription order not found' }, { status: 404 })
        }

        // Build subscription object from order data
        const subscription: Subscription = {
            id: order.id,
            userId: order.customerPrivyId || '',
            merchantId: order.merchantId,
            productId: order.productId,
            amount: order.amount,
            currency: order.currency,
            interval: 'monthly',
            status: 'past_due',
            customerWallet: order.customerWallet || '',
            merchantWallet: order.merchant.sponsorWallet || '',
            retryCount: 0, // Would be tracked in a real Subscription model
            maxRetries: 5,
            nextPaymentAt: new Date(),
        }

        const result = await retrySubscriptionPayment(subscription, backupWallet)

        // Update order status if payment succeeded
        if (result.success) {
            await prisma.order.update({
                where: { id: order.id },
                data: { status: 'settled' },
            })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('[Subscriptions] Retry error:', error)
        return NextResponse.json(
            { error: 'Subscription retry failed', details: String(error) },
            { status: 500 }
        )
    }
}

/**
 * GET /api/subscriptions/retry — Get subscription health overview
 */
export async function GET() {
    try {
        // Get all failed and recent orders as "subscriptions"
        const failedOrders = await prisma.order.findMany({
            where: { status: { in: ['failed', 'settled', 'pending'] } },
            include: { product: true, merchant: true },
            orderBy: { createdAt: 'desc' },
            take: 100,
        })

        const subscriptions: Subscription[] = failedOrders.map((o) => ({
            id: o.id,
            userId: o.customerPrivyId || '',
            merchantId: o.merchantId,
            productId: o.productId,
            amount: o.amount,
            currency: o.currency,
            interval: 'monthly' as const,
            status: o.status === 'failed' ? 'past_due' as const : 'active' as const,
            customerWallet: o.customerWallet || '',
            merchantWallet: o.merchant.sponsorWallet || '',
            retryCount: o.status === 'failed' ? 1 : 0,
            maxRetries: 5,
            nextPaymentAt: new Date(),
        }))

        const report = await analyzeSubscriptionsWithAI(subscriptions)
        return NextResponse.json(report)
    } catch (error) {
        console.error('[Subscriptions] Health check error:', error)
        return NextResponse.json(
            { error: 'Subscription health check failed', details: String(error) },
            { status: 500 }
        )
    }
}
