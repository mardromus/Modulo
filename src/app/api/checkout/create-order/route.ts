import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createOrderSchema = z.object({
    productId: z.string().uuid(),
    customerWallet: z.string().optional(),
    customerPrivyId: z.string().optional(),
})

// POST /api/checkout/create-order — Create a new order
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const data = createOrderSchema.parse(body)

        // Look up product and merchant
        const product = await prisma.product.findUnique({
            where: { id: data.productId },
            include: { merchant: true },
        })

        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            )
        }

        const order = await prisma.order.create({
            data: {
                merchantId: product.merchantId,
                productId: product.id,
                customerWallet: data.customerWallet || null,
                customerPrivyId: data.customerPrivyId || null,
                amount: product.priceAmount,
                currency: product.currency,
                status: 'pending',
            },
        })

        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            productName: product.name,
            merchantName: product.merchant.name,
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.message },
                { status: 400 }
            )
        }
        console.error('[Checkout] Create order error:', error)
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        )
    }
}
