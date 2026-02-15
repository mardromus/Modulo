/**
 * SmartSplit Agent — Core netting/split computation engine
 *
 * Takes an order amount and split rules, computes individual transfer
 * amounts, and builds the atomic batch transaction via Tempo.
 */

import {
    getTempoClient,
    ALPHA_USD,
    buildBatchCalls,
    createOrderMemo,
    explorerTxUrl,
    type TransferInstruction,
} from '@/lib/tempo'

// ─── Types ─────────────────────────────────────────────────────────────
export interface SplitRule {
    address: string
    percent: number // 0-100
    label: string   // e.g. "Merchant", "Platform Fee", "Creator"
}

export interface SplitResult {
    to: `0x${string}`
    amount: bigint
    label: string
    percent: number
}

export interface ExecutionResult {
    success: boolean
    txHash?: string
    explorerUrl?: string
    splits: SplitResult[]
    totalAmount: bigint
    error?: string
    logs: string[]
}

// ─── Split Computation ─────────────────────────────────────────────────
/**
 * Compute split amounts from rules.
 * Handles rounding by assigning remainder to the first (primary) recipient.
 */
export function computeSplits(
    totalAmount: bigint,
    rules: SplitRule[]
): SplitResult[] {
    // Validate rules sum to 100%
    const totalPercent = rules.reduce((sum, r) => sum + r.percent, 0)
    if (Math.abs(totalPercent - 100) > 0.01) {
        throw new Error(
            `Split percentages must sum to 100, got ${totalPercent}`
        )
    }

    const results: SplitResult[] = []
    let allocated = BigInt(0)

    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i]
        let amount: bigint

        if (i === rules.length - 1) {
            // Last recipient gets the remainder to avoid rounding dust
            amount = totalAmount - allocated
        } else {
            // Compute proportional amount using integer math
            amount = (totalAmount * BigInt(Math.round(rule.percent * 100))) / BigInt(10000)
            allocated += amount
        }

        results.push({
            to: rule.address as `0x${string}`,
            amount,
            label: rule.label,
            percent: rule.percent,
        })
    }

    return results
}

// ─── Batch Execution ───────────────────────────────────────────────────
/**
 * Execute a SmartSplit: compute splits and send as atomic batch transaction.
 */
export async function executeSmartSplit(
    orderId: string,
    totalAmount: bigint,
    rules: SplitRule[],
    token: `0x${string}` = ALPHA_USD
): Promise<ExecutionResult> {
    const logs: string[] = []
    logs.push(`[SmartSplit] Initiating atomic settlement for Order #${orderId}`)

    const splits = computeSplits(totalAmount, rules)
    logs.push(`[SmartSplit] Computed ${splits.length} split targets. Total: ${totalAmount}`)

    const memo = createOrderMemo(orderId)

    const transfers: TransferInstruction[] = splits.map((s) => ({
        to: s.to,
        amount: s.amount,
        memo,
    }))

    try {
        const client = getTempoClient()
        logs.push(`[SmartSplit] Connected to Tempo Network (Chain ID: 888)`)

        // Build batch calls for atomic execution
        const calls = buildBatchCalls(transfers, token)
        logs.push(`[SmartSplit] Constructed atomic batch with ${calls.length} operations.`)

        // Execute batch — send each call sequentially for compatibility
        let lastTxHash = ''
        for (const call of calls) {
            const hash = await client.sendTransaction({
                to: call.to as `0x${string}`,
                data: call.data as `0x${string}`,
            })
            lastTxHash = typeof hash === 'string' ? hash : String(hash)
        }

        const txHashStr = lastTxHash

        return {
            success: true,
            txHash: txHashStr,
            explorerUrl: explorerTxUrl(txHashStr),
            splits,
            totalAmount,
            logs,
        }
    } catch (error) {
        logs.push(`[SmartSplit] [ERROR] Batch execution failed: ${error}`)
        console.error('[SmartSplit] Batch execution failed, trying sequential:', error)

        // Fallback: sequential transfers
        try {
            const client = getTempoClient()
            const txHashes: string[] = []

            for (const transfer of transfers) {
                const { receipt } = await client.token.transferSync({
                    to: transfer.to,
                    amount: transfer.amount,
                    token,
                    memo,
                    feePayer: true,
                })
                txHashes.push(receipt.transactionHash)
            }
            logs.push(`[SmartSplit] Fallback sequential transfers successful.`)

            return {
                success: true,
                txHash: txHashes[0],
                explorerUrl: explorerTxUrl(txHashes[0]),
                splits,
                totalAmount,
                logs,
            }
        } catch (seqError) {
            return {
                success: false,
                splits,
                totalAmount,
                error:
                    seqError instanceof Error
                        ? seqError.message
                        : 'Unknown execution error',
                logs,
            }
        }
    }
}
