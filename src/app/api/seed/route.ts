import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/seed — Seed demo data for the dashboard
export async function GET() {
    try {
        // Delete existing demo data first (idempotent)
        await prisma.transaction.deleteMany({})
        await prisma.nettingRun.deleteMany({})
        await prisma.order.deleteMany({})
        await prisma.product.deleteMany({})
        await prisma.merchant.deleteMany({})
        await prisma.user.deleteMany({})

        // Create demo user
        const user = await prisma.user.create({
            data: {
                privyId: 'demo-user',
                email: 'merchant@modulo.io',
                walletAddress: '0x031891A61200FedDd622EbACC10734BC90093B2A',
            },
        })

        // Create demo merchant
        const merchant = await prisma.merchant.create({
            data: {
                name: 'TechStore Pro',
                ownerUserId: user.id,
                sponsorWallet: '0x031891A61200FedDd622EbACC10734BC90093B2A',
            },
        })

        // Create demo product with 85/10/5 split
        const product = await prisma.product.create({
            data: {
                merchantId: merchant.id,
                name: 'Premium Software License',
                priceAmount: '100',
                currency: 'AlphaUSD',
                splitJson: JSON.stringify([
                    {
                        address: '0xAcF8dBD0352a9D47135DA146EA5DbEfAD58340C4',
                        percent: 85,
                        label: 'Merchant',
                    },
                    {
                        address: '0x41A75fc9817AF9F2DB0c0e58C71Bc826339b3Acb',
                        percent: 10,
                        label: 'Platform Fee',
                    },
                    {
                        address: '0x88FB1167B01EcE2CAEe65c4E193Ba942D6F73d70',
                        percent: 5,
                        label: 'Creator Royalty',
                    },
                ]),
            },
        })

        // Create demo pending order
        const order = await prisma.order.create({
            data: {
                merchantId: merchant.id,
                productId: product.id,
                customerWallet: '0xe945797ebC84F1953Ff8131bC29277e567b881D4',
                amount: '100',
                currency: 'AlphaUSD',
                status: 'pending',
            },
        })

        return NextResponse.json({
            success: true,
            seeded: {
                userId: user.id,
                merchantId: merchant.id,
                productId: product.id,
                orderId: order.id,
            },
            message: 'Demo data seeded! Visit /dashboard to see it.',
        })
    } catch (error) {
        console.error('[Seed] Error:', error)
        return NextResponse.json(
            { error: 'Failed to seed data', details: String(error) },
            { status: 500 }
        )
    }
}
