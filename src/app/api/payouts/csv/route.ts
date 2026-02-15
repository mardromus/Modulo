import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
    parsePayoutCSV,
    validatePayoutRun,
    executePayout,
} from '@agents/payout-orchestrator'
import { randomUUID } from 'crypto'

/**
 * POST /api/payouts/csv — Upload CSV for bulk payout
 * Body: { csvContent: string } (raw CSV text)
 */
export async function POST(request: NextRequest) {
    try {
        const { csvContent } = await request.json()

        if (!csvContent || typeof csvContent !== 'string') {
            return NextResponse.json(
                { error: 'csvContent is required (raw CSV string)' },
                { status: 400 }
            )
        }

        // Parse CSV
        let recipients
        try {
            recipients = parsePayoutCSV(csvContent)
        } catch (parseError) {
            return NextResponse.json(
                { error: 'CSV parsing failed', details: String(parseError) },
                { status: 400 }
            )
        }

        if (recipients.length === 0) {
            return NextResponse.json({ error: 'No valid recipients found' }, { status: 400 })
        }

        // Validate
        const validation = validatePayoutRun(recipients)
        if (!validation.valid) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.errors },
                { status: 400 }
            )
        }

        // Generate run ID for idempotency
        const runId = randomUUID()

        // Execute payout
        const summary = await executePayout(runId, recipients)

        return NextResponse.json(summary)
    } catch (error) {
        console.error('[Payouts] CSV payout error:', error)
        return NextResponse.json(
            { error: 'Payout execution failed', details: String(error) },
            { status: 500 }
        )
    }
}

/**
 * GET /api/payouts/csv — List recent payout runs
 */
export async function GET() {
    try {
        // Get recent netting runs as proxy for payout runs
        const runs = await prisma.nettingRun.findMany({
            include: {
                order: true,
                transactions: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        })

        const payoutRuns = runs.map((run) => ({
            id: run.id,
            orderId: run.orderId,
            status: run.status,
            transactionCount: run.transactions.length,
            completedCount: run.transactions.filter((t) => t.status === 'confirmed').length,
            failedCount: run.transactions.filter((t) => t.status === 'failed').length,
            createdAt: run.createdAt,
        }))

        return NextResponse.json({ runs: payoutRuns })
    } catch (error) {
        console.error('[Payouts] List error:', error)
        return NextResponse.json(
            { error: 'Failed to list payout runs', details: String(error) },
            { status: 500 }
        )
    }
}
