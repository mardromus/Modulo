import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createScheduleSchema = z.object({
    productId: z.string(),
    customerWallet: z.string(),
    merchantWallet: z.string(),
    amount: z.string(),
    interval: z.enum(['weekly', 'monthly', 'yearly']),
})

// GET /api/merchants/:id/schedules — List scheduled payments
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: merchantId } = await params

        const subscriptions = await prisma.subscription.findMany({
            where: { merchantId },
            orderBy: { nextPaymentAt: 'asc' },
        })

        return NextResponse.json({ schedules: subscriptions })
    } catch (error) {
        console.error('[Schedules] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
    }
}

// POST /api/merchants/:id/schedules — Create a new scheduled payment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: merchantId } = await params
        const body = await request.json()
        const data = createScheduleSchema.parse(body)

        // Calculate next payment date based on interval
        const now = new Date()
        let nextPaymentAt = new Date(now)
        switch (data.interval) {
            case 'weekly':
                nextPaymentAt.setDate(now.getDate() + 7)
                break
            case 'monthly':
                nextPaymentAt.setMonth(now.getMonth() + 1)
                break
            case 'yearly':
                nextPaymentAt.setFullYear(now.getFullYear() + 1)
                break
        }

        const subscription = await prisma.subscription.create({
            data: {
                userId: 'system',
                merchantId,
                productId: data.productId,
                amount: data.amount,
                interval: data.interval,
                customerWallet: data.customerWallet,
                merchantWallet: data.merchantWallet,
                nextPaymentAt,
            },
        })

        return NextResponse.json({ schedule: subscription }, { status: 201 })
    } catch (error) {
        console.error('[Schedules] Create error:', error)
        return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
    }
}
