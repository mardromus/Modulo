import { createClient, http, publicActions, walletActions } from 'viem'
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts'
import { tempoModerato } from 'viem/chains'
import { tempoActions } from 'viem/tempo'
import { encodeFunctionData, parseUnits, stringToHex, pad } from 'viem'

// ─── Token Addresses ───────────────────────────────────────────────────
export const ALPHA_USD = (process.env.NEXT_PUBLIC_ALPHA_USD ||
    '0x20c0000000000000000000000000000000000001') as `0x${string}`

export const BETA_USD = (process.env.NEXT_PUBLIC_BETA_USD ||
    '0x20c0000000000000000000000000000000000002') as `0x${string}`

export const PATH_USD = (process.env.NEXT_PUBLIC_PATH_USD ||
    '0x20c0000000000000000000000000000000000000') as `0x${string}`

export const TOKENS = { ALPHA_USD, BETA_USD, PATH_USD } as const

// ─── Explorer ──────────────────────────────────────────────────────────
export const EXPLORER_URL =
    process.env.NEXT_PUBLIC_TEMPO_EXPLORER || 'https://explore.tempo.xyz'

export function explorerTxUrl(txHash: string): string {
    return `${EXPLORER_URL}/tx/${txHash}`
}

export function explorerAddressUrl(address: string): string {
    return `${EXPLORER_URL}/address/${address}`
}

// ─── TIP-20 ABI (subset) ──────────────────────────────────────────────
export const TIP20_ABI = [
    {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ type: 'bool' }],
    },
    {
        name: 'transferWithMemo',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
            { name: 'memo', type: 'bytes32' },
        ],
        outputs: [],
    },
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ type: 'uint256' }],
    },
    {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'uint8' }],
    },
] as const

// ─── Memo Helpers ──────────────────────────────────────────────────────
export function createOrderMemo(orderId: string): `0x${string}` {
    const memoStr = `order:${orderId.slice(0, 8)}:split:v1`
    return pad(stringToHex(memoStr), { size: 32 })
}

export function createAgentPayMemo(
    agentId: string,
    invoiceId: string
): `0x${string}` {
    const memoStr = `agentpay:${agentId.slice(0, 6)}:${invoiceId.slice(0, 6)}`
    return pad(stringToHex(memoStr), { size: 32 })
}

// ─── Server-Side Tempo Client (Sponsor Wallet) ────────────────────────
let _sponsorAccount: PrivateKeyAccount | null = null
let _tempoClient: ReturnType<typeof createTempoClient> | null = null

function getSponsorAccount(): PrivateKeyAccount {
    if (!_sponsorAccount) {
        const key = process.env.SPONSOR_PRIVATE_KEY
        if (!key) throw new Error('SPONSOR_PRIVATE_KEY not configured')
        _sponsorAccount = privateKeyToAccount(key as `0x${string}`)
    }
    return _sponsorAccount
}

function createTempoClient(account: PrivateKeyAccount) {
    return createClient({
        account,
        chain: tempoModerato,
        transport: http(
            process.env.NEXT_PUBLIC_TEMPO_RPC || 'https://rpc.moderato.tempo.xyz'
        ),
    })
        .extend(publicActions)
        .extend(walletActions)
        .extend(tempoActions())
}

export function getTempoClient() {
    if (!_tempoClient) {
        _tempoClient = createTempoClient(getSponsorAccount())
    }
    return _tempoClient
}

export function getSponsorAddress(): `0x${string}` {
    return getSponsorAccount().address
}

// ─── Build Batch Transfer Calls ────────────────────────────────────────
export interface TransferInstruction {
    to: `0x${string}`
    amount: bigint
    memo?: `0x${string}`
}

export function buildBatchCalls(
    transfers: TransferInstruction[],
    token: `0x${string}` = ALPHA_USD
) {
    return transfers.map((t) => ({
        to: token,
        data: encodeFunctionData({
            abi: TIP20_ABI,
            functionName: 'transfer',
            args: [t.to, t.amount],
        }),
    }))
}

// ─── Re-exports ────────────────────────────────────────────────────────
export { parseUnits, encodeFunctionData, stringToHex, pad }
export { tempoModerato } from 'viem/chains'
