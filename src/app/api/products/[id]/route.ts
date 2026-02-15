import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateProductSchema = z.object({
    name: z.string().min(1).optional(),
    priceAmount: z.string().optional(),
    currency: z.string().optional(),
    splitRules: z.array(
        z.object({
            address: z.string(),
            percent: z.number().min(0).max(100),
            label: z.string(),
        })
    ).optional(),
});

// GET /api/products/:id — Get details for a single product
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({
            product: {
                ...product,
                splitRules: JSON.parse(product.splitJson),
            }
        });
    } catch (error) {
        console.error('[Product] Get error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT /api/products/:id — Update a product
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const data = updateProductSchema.parse(body);

        let updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.priceAmount) updateData.priceAmount = data.priceAmount;
        if (data.currency) updateData.currency = data.currency;

        if (data.splitRules) {
            const totalPercent = data.splitRules.reduce((s, r) => s + r.percent, 0);
            if (Math.abs(totalPercent - 100) > 0.01) {
                return NextResponse.json(
                    { error: `Split percentages must sum to 100, got ${totalPercent}` },
                    { status: 400 }
                );
            }
            updateData.splitJson = JSON.stringify(data.splitRules);
        }

        const product = await prisma.product.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ success: true, product });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input', details: error.message }, { status: 400 });
        }
        console.error('[Product] Update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
