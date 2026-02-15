import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params;

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }
        console.log(`[Invoice API] Fetching order: ${orderId}`);

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                merchant: {
                    include: {
                        owner: true
                    }
                },
                product: true,
                nettingRuns: {
                    include: {
                        transactions: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ order });
    } catch (error) {
        console.error('[Invoice API] Error fetching order:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
