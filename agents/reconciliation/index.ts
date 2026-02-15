/**
 * Reconciliation Agent — Watches TransferWithMemo events and
 * matches them to orders in the database.
 */

import { createClient, http, publicActions } from 'viem'
import { tempoModerato } from 'viem/chains'
import { ALPHA_USD, TIP20_ABI } from '@/lib/tempo'

// ─── Types ─────────────────────────────────────────────────────────────
export interface ReconciliationEvent {
    from: string
    to: string
    value: bigint
    memo: string
    txHash: string
    blockNumber: bigint
}

// ─── Memo Parser ───────────────────────────────────────────────────────
/**
 * Parse a memo hex string to extract order information.
 * Expected format: "order:<orderId>:split:v1"
 */
export function parseMemo(memoHex: string): {
    type: 'order' | 'agentpay' | 'subscription' | 'unknown'
    orderId?: string
    agentId?: string
    invoiceId?: string
} {
    try {
        // Convert hex to string, trim null bytes
        const memoStr = Buffer.from(memoHex.replace('0x', ''), 'hex')
            .toString('utf8')
            .replace(/\0/g, '')
            .trim()

        if (memoStr.startsWith('order:')) {
            const parts = memoStr.split(':')
            return {
                type: 'order',
                orderId: parts[1],
            }
        }

        if (memoStr.startsWith('agentpay:')) {
            const parts = memoStr.split(':')
            return {
                type: 'agentpay',
                agentId: parts[1],
                invoiceId: parts[2],
            }
        }

        if (memoStr.startsWith('sub:')) {
            return { type: 'subscription' }
        }

        return { type: 'unknown' }
    } catch {
        return { type: 'unknown' }
    }
}

// ─── Event Watcher ─────────────────────────────────────────────────────
const TransferWithMemoEvent = {
    type: 'event',
    name: 'TransferWithMemo',
    inputs: [
        { name: 'from', type: 'address', indexed: true },
        { name: 'to', type: 'address', indexed: true },
        { name: 'value', type: 'uint256', indexed: false },
        { name: 'memo', type: 'bytes32', indexed: true },
    ],
} as const

/**
 * Start watching for TransferWithMemo events.
 * Returns an unwatch function to stop the listener.
 */
export function startReconciliationWatcher(
    onEvent: (event: ReconciliationEvent) => Promise<void>
): () => void {
    const client = createClient({
        chain: tempoModerato,
        transport: http(
            process.env.NEXT_PUBLIC_TEMPO_RPC || 'https://rpc.moderato.tempo.xyz'
        ),
    }).extend(publicActions)

    const unwatch = client.watchEvent({
        address: ALPHA_USD,
        event: TransferWithMemoEvent,
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    const args = log.args

                    if (!args) continue

                    await onEvent({
                        from: String(args.from || ''),
                        to: String(args.to || ''),
                        value: (args.value as bigint) || BigInt(0),
                        memo: String(args.memo || ''),
                        txHash: log.transactionHash || '',
                        blockNumber: log.blockNumber || BigInt(0),
                    })
                } catch (error) {
                    console.error('[Reconciliation] Error processing event:', error)
                }
            }
        },
    })

    console.log('[Reconciliation] Watcher started for AlphaUSD transfers')
    return unwatch
}

// ─── Health Check ──────────────────────────────────────────────────────
export function getAgentHealth() {
    return {
        agent: 'reconciliation',
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    }
}
