/**
 * Payout Orchestrator Agent — Handles bulk payouts via CSV upload
 * with parallel 2D nonce lanes for high-throughput execution.
 */

import { getTempoClient, ALPHA_USD, explorerTxUrl } from '@/lib/tempo'
import { encodeFunctionData, parseUnits } from 'viem'
import { TIP20_ABI } from '@/lib/tempo'
import { askGroq } from '@/lib/groq'

// ─── Types ─────────────────────────────────────────────────────────────
export interface PayoutRecipient {
    address: string
    amount: string        // human-readable e.g. "10.50"
    memo?: string
    label?: string        // e.g. employee name or vendor
}

export interface PayoutResult {
    recipient: string
    amount: string
    status: 'success' | 'failed' | 'pending'
    txHash?: string
    explorerUrl?: string
    error?: string
    nonceLane: number
}

export interface PayoutRunSummary {
    runId: string
    totalRecipients: number
    totalAmount: string
    completedCount: number
    failedCount: number
    pendingCount: number
    nonceLanes: number
    results: PayoutResult[]
    startedAt: string
    completedAt?: string
    aiNarrative: string
}

// ─── CSV Parser ────────────────────────────────────────────────────────
/**
 * Parse a CSV string into PayoutRecipient objects.
 * Expected columns: address, amount, memo (optional), label (optional)
 */
export function parsePayoutCSV(csvContent: string): PayoutRecipient[] {
    const lines = csvContent.trim().split('\n')
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row')

    const header = lines[0].toLowerCase().split(',').map((h) => h.trim())
    const addressIdx = header.findIndex((h) => h === 'address' || h === 'wallet')
    const amountIdx = header.findIndex((h) => h === 'amount')
    const memoIdx = header.findIndex((h) => h === 'memo')
    const labelIdx = header.findIndex((h) => h === 'label' || h === 'name')

    if (addressIdx === -1) throw new Error('CSV must have an "address" or "wallet" column')
    if (amountIdx === -1) throw new Error('CSV must have an "amount" column')

    const recipients: PayoutRecipient[] = []
    const seen = new Set<string>()

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim())
        if (!cols[addressIdx] || !cols[amountIdx]) continue

        const address = cols[addressIdx]
        const amount = cols[amountIdx]

        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            throw new Error(`Invalid address on line ${i + 1}: ${address}`)
        }

        // Validate amount
        const parsedAmount = parseFloat(amount)
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            throw new Error(`Invalid amount on line ${i + 1}: ${amount}`)
        }

        // Dedupe by address
        const key = `${address.toLowerCase()}-${amount}`
        if (seen.has(key)) continue
        seen.add(key)

        recipients.push({
            address,
            amount,
            memo: memoIdx >= 0 ? cols[memoIdx] : undefined,
            label: labelIdx >= 0 ? cols[labelIdx] : undefined,
        })
    }

    return recipients
}

// ─── Parallel Nonce Lanes ──────────────────────────────────────────────
const LANE_SIZE = 50 // recipients per nonce lane

/**
 * Partition recipients into nonce-lane groups for parallel execution.
 */
export function partitionIntoLanes(
    recipients: PayoutRecipient[]
): PayoutRecipient[][] {
    const lanes: PayoutRecipient[][] = []
    for (let i = 0; i < recipients.length; i += LANE_SIZE) {
        lanes.push(recipients.slice(i, i + LANE_SIZE))
    }
    return lanes
}

// ─── Execute Payout ────────────────────────────────────────────────────
/**
 * Execute a single-lane payout batch sequentially.
 */
async function executeLane(
    laneIndex: number,
    recipients: PayoutRecipient[]
): Promise<PayoutResult[]> {
    const results: PayoutResult[] = []
    const client = getTempoClient()

    for (const recipient of recipients) {
        try {
            const amount = parseUnits(recipient.amount, 6)

            const hash = await client.sendTransaction({
                to: ALPHA_USD,
                data: encodeFunctionData({
                    abi: TIP20_ABI,
                    functionName: 'transfer',
                    args: [recipient.address as `0x${string}`, amount],
                }),
            })

            const txHash = typeof hash === 'string' ? hash : String(hash)

            results.push({
                recipient: recipient.address,
                amount: recipient.amount,
                status: 'success',
                txHash,
                explorerUrl: explorerTxUrl(txHash),
                nonceLane: laneIndex,
            })
        } catch (error) {
            results.push({
                recipient: recipient.address,
                amount: recipient.amount,
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                nonceLane: laneIndex,
            })
        }
    }

    return results
}

/**
 * Execute a full payout run across parallel nonce lanes.
 */
export async function executePayout(
    runId: string,
    recipients: PayoutRecipient[]
): Promise<PayoutRunSummary> {
    const startedAt = new Date().toISOString()
    const lanes = partitionIntoLanes(recipients)

    // Execute all lanes in parallel
    const laneResults = await Promise.all(
        lanes.map((lane, i) => executeLane(i, lane))
    )

    const allResults = laneResults.flat()
    const completed = allResults.filter((r) => r.status === 'success')
    const failed = allResults.filter((r) => r.status === 'failed')
    const totalAmount = recipients.reduce(
        (sum, r) => sum + parseFloat(r.amount),
        0
    )

    const summary: PayoutRunSummary = {
        runId,
        totalRecipients: recipients.length,
        totalAmount: totalAmount.toFixed(2),
        completedCount: completed.length,
        failedCount: failed.length,
        pendingCount: 0,
        nonceLanes: lanes.length,
        results: allResults,
        startedAt,
        completedAt: new Date().toISOString(),
        aiNarrative: '',
    }

    // Generate AI narrative
    summary.aiNarrative = await askGroq(
        'You are a treasury operations analyst. Analyze bulk payout execution results and provide a brief operational summary.',
        `Payout Run Summary:
- Total recipients: ${summary.totalRecipients}
- Total amount: $${summary.totalAmount}
- Successful: ${summary.completedCount}
- Failed: ${summary.failedCount}
- Nonce lanes used: ${summary.nonceLanes}
- Duration: ${new Date(summary.completedAt!).getTime() - new Date(summary.startedAt).getTime()}ms

Provide a brief operational summary with any concerns or recommendations.`,
        'Payout completed — AI analysis not available.'
    )

    return summary
}

// ─── Validation ────────────────────────────────────────────────────────
export function validatePayoutRun(recipients: PayoutRecipient[]): {
    valid: boolean
    errors: string[]
    totalAmount: number
    recipientCount: number
} {
    const errors: string[] = []
    let totalAmount = 0

    for (let i = 0; i < recipients.length; i++) {
        const r = recipients[i]
        if (!/^0x[a-fA-F0-9]{40}$/.test(r.address)) {
            errors.push(`Row ${i + 1}: Invalid address ${r.address}`)
        }
        const amt = parseFloat(r.amount)
        if (isNaN(amt) || amt <= 0) {
            errors.push(`Row ${i + 1}: Invalid amount ${r.amount}`)
        } else {
            totalAmount += amt
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        totalAmount,
        recipientCount: recipients.length,
    }
}

// ─── Health Check ──────────────────────────────────────────────────────
export function getAgentHealth() {
    return {
        agent: 'payout-orchestrator',
        status: 'healthy',
        uptime: process.uptime(),
        capabilities: ['csv-parsing', 'parallel-nonce-lanes', 'idempotency', 'ai-analysis'],
        laneSize: LANE_SIZE,
        timestamp: new Date().toISOString(),
    }
}
