import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { analyzeRevenueWithAI } from '@agents/revenue-forecaster'
import { analyzePricingWithAI } from '@agents/smart-pricing'
import { analyzeCashWithAI } from '@agents/cash-optimizer'
import { generateBusinessReportWithAI } from '@agents/business-insights'

/**
 * GET /api/ai/insights — Comprehensive AI insights dashboard
 *
 * Aggregates all agent outputs into a single intelligence briefing.
 * Now powered by Groq LLM for strategic natural-language analysis.
 */
export async function GET() {
    try {
        // Fetch all data
        const [merchants, orders, products, transactions] = await Promise.all([
            prisma.merchant.findMany({ include: { _count: { select: { orders: true, products: true } } } }),
            prisma.order.findMany({
                include: { product: true },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.product.findMany({
                include: {
                    orders: {
                        select: { createdAt: true, amount: true, status: true },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            }),
            prisma.transaction.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
        ])

        const merchant = merchants[0]

        // ── Run all AI agents in parallel for speed ─────────────────────
        const orderData = orders.map((o) => ({
            amount: o.amount,
            createdAt: o.createdAt,
            status: o.status,
        }))

        const productData = products.map((p) => ({
            id: p.id,
            name: p.name,
            priceAmount: p.priceAmount,
            orders: p.orders.map((o) => ({
                createdAt: o.createdAt,
                amount: o.amount,
                status: o.status,
            })),
        }))

        const dailyVolume = orders.length > 0
            ? orders.reduce((s, o) => s + parseFloat(o.amount), 0) / Math.max(1, 30)
            : 0

        const businessOrderData = orders.map((o) => ({
            customerWallet: o.customerWallet,
            amount: o.amount,
            createdAt: o.createdAt,
            status: o.status,
        }))

        // Run all 4 LLM-enhanced agents in parallel
        const [revenueAnalysis, pricingAnalysis, cashAnalysis, businessReport] = await Promise.all([
            analyzeRevenueWithAI(orderData),
            analyzePricingWithAI(productData),
            analyzeCashWithAI(
                dailyVolume,
                [
                    { token: 'AlphaUSD', balance: 0 },
                    { token: 'BetaUSD', balance: 0 },
                    { token: 'PathUSD', balance: 0 },
                ],
                dailyVolume * 0.1
            ),
            generateBusinessReportWithAI(
                businessOrderData,
                products.length,
                merchant?.name || 'Your Business'
            ),
        ])

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            merchant: merchant
                ? { id: merchant.id, name: merchant.name, products: merchant._count.products, orders: merchant._count.orders }
                : null,
            revenue: revenueAnalysis,
            pricing: pricingAnalysis,
            cash: cashAnalysis,
            business: businessReport,
        })
    } catch (error) {
        console.error('[AI/Insights] Error:', error)
        return NextResponse.json(
            { error: 'Failed to generate AI insights', details: String(error) },
            { status: 500 }
        )
    }
}
