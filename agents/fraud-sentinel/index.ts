/**
 * Fraud Sentinel Agent
 *
 * Pre-settlement risk scoring engine that analyzes transaction
 * patterns, velocity, amount anomalies, and wallet reputation
 * to flag potentially fraudulent orders before execution.
 */

export interface RiskFactor {
    name: string
    score: number // 0-100 (higher = riskier)
    weight: number // 0-1
    description: string
    evidence: string
}

export interface FraudAssessment {
    orderId: string
    overallRisk: number // 0-100
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    action: 'approve' | 'review' | 'block'
    factors: RiskFactor[]
    recommendations: string[]
    processingTime: number // ms
    aiNarrative: string
}

// ─── Velocity Check ────────────────────────────────────────────────────
function velocityCheck(
    walletOrders: Array<{ createdAt: Date | string; amount: string }>,
    currentAmount: number
): RiskFactor {
    const now = Date.now()
    const last24h = walletOrders.filter(
        (o) => now - new Date(o.createdAt).getTime() < 24 * 60 * 60 * 1000
    )
    const lastHour = walletOrders.filter(
        (o) => now - new Date(o.createdAt).getTime() < 60 * 60 * 1000
    )

    let score = 0
    let evidence = ''

    if (lastHour.length >= 5) {
        score = 80
        evidence = `${lastHour.length} orders in the last hour (threshold: 5)`
    } else if (last24h.length >= 20) {
        score = 60
        evidence = `${last24h.length} orders in the last 24h (threshold: 20)`
    } else if (lastHour.length >= 3) {
        score = 30
        evidence = `${lastHour.length} orders in the last hour`
    } else {
        score = 5
        evidence = `Normal velocity: ${last24h.length} orders in 24h`
    }

    return {
        name: 'Transaction Velocity',
        score,
        weight: 0.3,
        description: 'Rate of transactions from this wallet',
        evidence,
    }
}

// ─── Amount Anomaly Detection ──────────────────────────────────────────
function amountAnomaly(
    historicalAmounts: number[],
    currentAmount: number
): RiskFactor {
    if (historicalAmounts.length < 3) {
        return {
            name: 'Amount Anomaly',
            score: 20,
            weight: 0.25,
            description: 'Statistical deviation from typical order amounts',
            evidence: 'Insufficient history for anomaly detection (< 3 orders)',
        }
    }

    const mean = historicalAmounts.reduce((s, v) => s + v, 0) / historicalAmounts.length
    const stdDev = Math.sqrt(
        historicalAmounts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / historicalAmounts.length
    )

    const zScore = stdDev > 0 ? Math.abs(currentAmount - mean) / stdDev : 0

    let score: number
    let evidence: string

    if (zScore > 3) {
        score = 90
        evidence = `Amount $${currentAmount} is ${zScore.toFixed(1)}σ from mean $${mean.toFixed(2)} (extreme outlier)`
    } else if (zScore > 2) {
        score = 60
        evidence = `Amount $${currentAmount} is ${zScore.toFixed(1)}σ from mean $${mean.toFixed(2)} (significant deviation)`
    } else if (zScore > 1.5) {
        score = 30
        evidence = `Amount $${currentAmount} is ${zScore.toFixed(1)}σ from mean $${mean.toFixed(2)} (mild deviation)`
    } else {
        score = 5
        evidence = `Amount $${currentAmount} is within normal range (mean: $${mean.toFixed(2)})`
    }

    return {
        name: 'Amount Anomaly',
        score,
        weight: 0.25,
        description: 'Statistical deviation from typical order amounts',
        evidence,
    }
}

// ─── New Wallet Check ──────────────────────────────────────────────────
function newWalletCheck(
    totalOrders: number,
    walletAge: number // days
): RiskFactor {
    let score: number
    let evidence: string

    if (totalOrders === 0 && walletAge < 1) {
        score = 70
        evidence = 'Brand new wallet with no transaction history'
    } else if (totalOrders < 3 && walletAge < 7) {
        score = 45
        evidence = `Only ${totalOrders} orders in ${walletAge} days`
    } else if (totalOrders >= 10 && walletAge >= 30) {
        score = 5
        evidence = `Established wallet: ${totalOrders} orders over ${walletAge} days`
    } else {
        score = 20
        evidence = `${totalOrders} orders over ${walletAge} days`
    }

    return {
        name: 'Wallet Reputation',
        score,
        weight: 0.25,
        description: 'Historical trust score based on wallet age and activity',
        evidence,
    }
}

// ─── Geographic/Time Pattern Check ─────────────────────────────────────
function timePatternCheck(
    hour: number,
    recentOrders: Array<{ createdAt: Date | string }>
): RiskFactor {
    // Check for unusual hours (2-5 AM local)
    const isUnusualHour = hour >= 2 && hour <= 5

    // Check for rapid succession (orders within 10 seconds)
    let rapidSuccession = false
    if (recentOrders.length >= 2) {
        const times = recentOrders.map((o) => new Date(o.createdAt).getTime()).sort()
        for (let i = 1; i < times.length; i++) {
            if (times[i] - times[i - 1] < 10000) {
                rapidSuccession = true
                break
            }
        }
    }

    let score = 0
    let evidence = ''

    if (rapidSuccession && isUnusualHour) {
        score = 75
        evidence = 'Rapid-fire orders during unusual hours (2-5 AM)'
    } else if (rapidSuccession) {
        score = 50
        evidence = 'Orders placed within 10-second intervals (possible automation)'
    } else if (isUnusualHour) {
        score = 25
        evidence = `Order placed at ${hour}:00 (unusual activity hours)`
    } else {
        score = 5
        evidence = 'Normal time pattern'
    }

    return {
        name: 'Time Pattern',
        score,
        weight: 0.2,
        description: 'Temporal anomalies suggesting automated or suspicious activity',
        evidence,
    }
}

// ─── Main Risk Assessment ──────────────────────────────────────────────
export function assessRisk(
    orderId: string,
    amount: number,
    walletAddress: string,
    walletOrders: Array<{ createdAt: Date | string; amount: string; status: string }>,
    walletAgeDays: number = 30
): FraudAssessment {
    const startTime = Date.now()

    const historicalAmounts = walletOrders.map((o) => parseFloat(o.amount))
    const hour = new Date().getHours()

    // Run all risk factor checks
    const factors: RiskFactor[] = [
        velocityCheck(walletOrders, amount),
        amountAnomaly(historicalAmounts, amount),
        newWalletCheck(walletOrders.length, walletAgeDays),
        timePatternCheck(hour, walletOrders),
    ]

    // Calculate weighted overall risk
    const totalWeight = factors.reduce((s, f) => s + f.weight, 0)
    const overallRisk = Math.round(
        factors.reduce((s, f) => s + f.score * f.weight, 0) / totalWeight
    )

    // Determine risk level and action
    let riskLevel: FraudAssessment['riskLevel']
    let action: FraudAssessment['action']
    const recommendations: string[] = []

    if (overallRisk >= 75) {
        riskLevel = 'critical'
        action = 'block'
        recommendations.push('Block transaction and flag wallet for manual review.')
        recommendations.push('Consider notifying the merchant about suspicious activity.')
    } else if (overallRisk >= 50) {
        riskLevel = 'high'
        action = 'review'
        recommendations.push('Hold settlement for manual review before processing.')
        recommendations.push('Request additional verification from the customer.')
    } else if (overallRisk >= 25) {
        riskLevel = 'medium'
        action = 'approve'
        recommendations.push('Approved with monitoring. Flag for post-settlement review.')
    } else {
        riskLevel = 'low'
        action = 'approve'
        recommendations.push('Transaction appears legitimate. Proceed with settlement.')
    }

    return {
        orderId,
        overallRisk,
        riskLevel,
        action,
        factors,
        recommendations,
        processingTime: Date.now() - startTime,
        aiNarrative: '',
    }
}

// ─── LLM-Enhanced Analysis ─────────────────────────────────────────────
export async function assessRiskWithAI(
    orderId: string,
    amount: number,
    walletAddress: string,
    walletOrders: Array<{ createdAt: Date | string; amount: string; status: string }>,
    walletAgeDays: number = 30
): Promise<FraudAssessment> {
    const { askGroq } = await import('@/lib/groq')
    const result = assessRisk(orderId, amount, walletAddress, walletOrders, walletAgeDays)

    const prompt = `You are a fraud detection specialist for a web3 payment platform.
Analyze this risk assessment and provide a concise threat narrative in 2-3 paragraphs.
Explain: what patterns were detected, why the risk level was assigned, and specific next steps.
Be direct and actionable. Think like a fintech compliance officer.`

    const data = `Risk Assessment for Order ${orderId}:
- Overall risk: ${result.overallRisk}/100 (${result.riskLevel})
- Action: ${result.action}
- Amount: $${amount}
- Wallet: ${walletAddress.slice(0, 10)}...${walletAddress.slice(-6)}
- Wallet age: ${walletAgeDays} days, ${walletOrders.length} prior orders
- Risk factors: ${result.factors.map(f => `${f.name}: ${f.score}/100 (weight: ${f.weight}) — ${f.evidence}`).join('; ')}
- Recommendations: ${result.recommendations.join('; ')}`

    result.aiNarrative = await askGroq(prompt, data, 'Risk analysis requires GROQ_API_KEY for AI-powered insights.')
    return result
}
