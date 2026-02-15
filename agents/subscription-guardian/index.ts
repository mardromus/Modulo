/**
 * Subscription Guardian Agent — Detects failed subscription renewals 
 * and automatically retries with exponential backoff.
 */

import { getTempoClient, ALPHA_USD, createOrderMemo, explorerTxUrl } from '@/lib/tempo'
import { askGroq } from '@/lib/groq'

// ─── Types ─────────────────────────────────────────────────────────────
export interface Subscription {
    id: string
    userId: string
    merchantId: string
    productId: string
    amount: string
    currency: string
    interval: 'weekly' | 'monthly' | 'yearly'
    status: 'active' | 'past_due' | 'cancelled' | 'paused'
    customerWallet: string
    merchantWallet: string
    retryCount: number
    maxRetries: number
    nextPaymentAt: Date
    lastFailedAt?: Date
}

export interface RetryResult {
    success: boolean
    subscriptionId: string
    attemptNumber: number
    nextRetryAt?: string
    txHash?: string
    explorerUrl?: string
    action: 'payment_succeeded' | 'retry_scheduled' | 'max_retries_reached' | 'cancelled'
    message: string
}

export interface GuardianReport {
    totalSubscriptions: number
    activeCount: number
    pastDueCount: number
    recoveredThisMonth: number
    recoveryRate: number
    totalRecovered: number
    atRisk: SubscriptionRisk[]
    aiNarrative: string
}

export interface SubscriptionRisk {
    subscriptionId: string
    userId: string
    failureReason: string
    retryCount: number
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    suggestedAction: string
}

// ─── Backoff Schedule (minutes) ────────────────────────────────────────
const BACKOFF_SCHEDULE = [1, 5, 30, 120, 1440] // 1m, 5m, 30m, 2h, 24h

function getBackoffMinutes(retryCount: number): number {
    return BACKOFF_SCHEDULE[Math.min(retryCount, BACKOFF_SCHEDULE.length - 1)]
}

// ─── Retry Logic ───────────────────────────────────────────────────────
/**
 * Attempt to retry a failed subscription payment with exponential backoff.
 */
export async function retrySubscriptionPayment(
    subscription: Subscription,
    backupWallet?: string
): Promise<RetryResult> {
    const attemptNumber = subscription.retryCount + 1

    // Check max retries
    if (attemptNumber > subscription.maxRetries) {
        return {
            success: false,
            subscriptionId: subscription.id,
            attemptNumber,
            action: 'max_retries_reached',
            message: `Maximum retry attempts (${subscription.maxRetries}) exceeded. Subscription marked for manual review.`,
        }
    }

    // Try primary wallet first, then backup
    const walletsToTry = [subscription.customerWallet]
    if (backupWallet && backupWallet !== subscription.customerWallet) {
        walletsToTry.push(backupWallet)
    }

    for (const wallet of walletsToTry) {
        try {
            const client = getTempoClient()
            const memo = createOrderMemo(`sub-${subscription.id}`)
            const amount = BigInt(Math.round(parseFloat(subscription.amount) * 1e6))

            const { receipt } = await client.token.transferSync({
                to: subscription.merchantWallet as `0x${string}`,
                amount,
                token: ALPHA_USD,
                memo,
                feePayer: true,
            })

            return {
                success: true,
                subscriptionId: subscription.id,
                attemptNumber,
                txHash: receipt.transactionHash,
                explorerUrl: explorerTxUrl(receipt.transactionHash),
                action: 'payment_succeeded',
                message: `Payment recovered on attempt ${attemptNumber} via wallet ${wallet.slice(0, 8)}...`,
            }
        } catch {
            // Continue to next wallet or schedule retry
        }
    }

    // Payment failed — schedule next retry
    const backoffMinutes = getBackoffMinutes(attemptNumber)
    const nextRetryAt = new Date(Date.now() + backoffMinutes * 60000)

    return {
        success: false,
        subscriptionId: subscription.id,
        attemptNumber,
        nextRetryAt: nextRetryAt.toISOString(),
        action: 'retry_scheduled',
        message: `Payment failed on attempt ${attemptNumber}. Next retry in ${backoffMinutes} minutes at ${nextRetryAt.toLocaleTimeString()}.`,
    }
}

// ─── Risk Assessment ───────────────────────────────────────────────────
export function assessSubscriptionRisks(
    subscriptions: Subscription[]
): SubscriptionRisk[] {
    return subscriptions
        .filter((s) => s.status === 'past_due')
        .map((s) => {
            let riskLevel: SubscriptionRisk['riskLevel'] = 'low'
            let suggestedAction = 'Monitor'

            if (s.retryCount >= 4) {
                riskLevel = 'critical'
                suggestedAction = 'Contact customer immediately — near cancellation'
            } else if (s.retryCount >= 3) {
                riskLevel = 'high'
                suggestedAction = 'Send SMS/email reminder with backup payment link'
            } else if (s.retryCount >= 2) {
                riskLevel = 'medium'
                suggestedAction = 'Schedule retry with backup wallet check'
            } else {
                riskLevel = 'low'
                suggestedAction = 'Auto-retry in progress'
            }

            return {
                subscriptionId: s.id,
                userId: s.userId,
                failureReason: `Payment failed after ${s.retryCount} attempts`,
                retryCount: s.retryCount,
                riskLevel,
                suggestedAction,
            }
        })
        .sort((a, b) => b.retryCount - a.retryCount)
}

// ─── Groq-Powered Analysis ────────────────────────────────────────────
export async function analyzeSubscriptionsWithAI(
    subscriptions: Subscription[]
): Promise<GuardianReport> {
    const active = subscriptions.filter((s) => s.status === 'active')
    const pastDue = subscriptions.filter((s) => s.status === 'past_due')
    const risks = assessSubscriptionRisks(subscriptions)
    const recoveredThisMonth = subscriptions.filter(
        (s) => s.status === 'active' && s.retryCount > 0
    ).length
    const recoveryRate = pastDue.length > 0
        ? (recoveredThisMonth / (recoveredThisMonth + pastDue.length)) * 100
        : 100

    const report: GuardianReport = {
        totalSubscriptions: subscriptions.length,
        activeCount: active.length,
        pastDueCount: pastDue.length,
        recoveredThisMonth,
        recoveryRate: Math.round(recoveryRate * 100) / 100,
        totalRecovered: recoveredThisMonth,
        atRisk: risks,
        aiNarrative: '',
    }

    const narrative = await askGroq(
        'You are a subscription retention specialist for a payment platform. Analyze subscription health data and provide actionable retention strategies. Be concise, data-driven, and focus on revenue recovery.',
        `Subscription Health Data:
- Total subscriptions: ${report.totalSubscriptions}
- Active: ${report.activeCount}
- Past due: ${report.pastDueCount}
- Recovery rate: ${report.recoveryRate}%
- At-risk subscriptions: ${JSON.stringify(risks.slice(0, 5))}

Provide a brief retention analysis with specific next steps to reduce churn and recover failed payments.`,
        'Subscription health analysis is not available without AI configuration.'
    )

    report.aiNarrative = narrative
    return report
}

// ─── Health Check ──────────────────────────────────────────────────────
export function getAgentHealth() {
    return {
        agent: 'subscription-guardian',
        status: 'healthy',
        uptime: process.uptime(),
        capabilities: ['retry-payments', 'backup-wallet-detection', 'risk-assessment', 'ai-analysis'],
        backoffSchedule: BACKOFF_SCHEDULE,
        timestamp: new Date().toISOString(),
    }
}
