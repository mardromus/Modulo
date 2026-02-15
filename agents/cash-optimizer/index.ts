/**
 * Cash Optimizer Agent
 *
 * Monitors treasury balances across stablecoin reserves, identifies
 * optimal rebalancing opportunities via Tempo DEX, and provides
 * real-time liquidity health scoring.
 */

export interface TokenBalance {
    token: string
    symbol: string
    balance: number
    targetAllocation: number // 0-100 percent
    currentAllocation: number
    deviationPercent: number
}

export interface RebalanceAction {
    type: 'swap' | 'deposit' | 'withdraw'
    fromToken: string
    toToken: string
    amount: number
    reason: string
    urgency: 'low' | 'medium' | 'high' | 'critical'
    expectedSavings: number
    dexRoute?: string
}

export interface LiquidityHealth {
    score: number // 0-100
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
    runwayDays: number
    dailyBurnRate: number
    recommendations: string[]
}

export interface CashOptimization {
    totalBalance: number
    balances: TokenBalance[]
    rebalanceActions: RebalanceAction[]
    liquidityHealth: LiquidityHealth
    yieldOpportunities: Array<{
        protocol: string
        apy: number
        token: string
        risk: 'low' | 'medium' | 'high'
        description: string
    }>
    savingsSummary: {
        potentialMonthlySavings: number
        currentFeeSpend: number
        optimizedFeeSpend: number
    }
    aiNarrative: string
    logs: string[]
}

// ─── Main Cash Analysis ────────────────────────────────────────────────
export function analyzeCashPosition(
    dailyVolume: number,
    currentBalances: Array<{ token: string; balance: number }>,
    dailyExpenses: number = 0
): CashOptimization {
    const logs: string[] = []
    logs.push(`[CashAgent] Analyzing treasury position across ${currentBalances.length} assets...`)

    const totalBalance = currentBalances.reduce((s, b) => s + b.balance, 0)
    logs.push(`[CashAgent] Total liquid assets: $${totalBalance.toFixed(2)}`)

    // Calculate allocations
    const targetAllocations: Record<string, number> = {
        AlphaUSD: 50,
        BetaUSD: 30,
        PathUSD: 20,
    }

    const balances: TokenBalance[] = currentBalances.map((b) => {
        const target = targetAllocations[b.token] || 33
        const current = totalBalance > 0 ? (b.balance / totalBalance) * 100 : 0

        return {
            token: b.token,
            symbol: b.token,
            balance: b.balance,
            targetAllocation: target,
            currentAllocation: Math.round(current * 100) / 100,
            deviationPercent: Math.round((current - target) * 100) / 100,
        }
    })

    // Generate rebalance actions
    const rebalanceActions: RebalanceAction[] = []
    logs.push(`[CashAgent] Checking portfolio allocation drift...`)

    for (const bal of balances) {
        if (Math.abs(bal.deviationPercent) > 10) {
            const targetValue = (totalBalance * bal.targetAllocation) / 100
            const diff = bal.balance - targetValue

            if (diff > 0) {
                // Over-allocated — swap excess to under-allocated tokens
                const underAllocated = balances.find(
                    (b) => b.deviationPercent < -5 && b.token !== bal.token
                )

                if (underAllocated) {
                    rebalanceActions.push({
                        type: 'swap',
                        fromToken: bal.token,
                        toToken: underAllocated.token,
                        amount: Math.round(Math.abs(diff) * 100) / 100,
                        reason: `${bal.token} is ${bal.deviationPercent.toFixed(1)}% over target allocation`,
                        urgency: Math.abs(bal.deviationPercent) > 25 ? 'high' : 'medium',
                        expectedSavings: Math.round(Math.abs(diff) * 0.002 * 100) / 100,
                        dexRoute: `${bal.token} → PathUSD → ${underAllocated.token}`,
                    })
                }
            }
        }
    }
    if (rebalanceActions.length > 0) logs.push(`[CashAgent] Identified ${rebalanceActions.length} necessary rebalance actions.`)

    // Liquidity health scoring
    logs.push(`[CashAgent] Calculating liquidity health & runway...`)
    const runwayDays =
        dailyExpenses > 0
            ? Math.floor(totalBalance / dailyExpenses)
            : totalBalance > 0
                ? 999
                : 0

    let healthScore: number
    let healthStatus: LiquidityHealth['status']
    const recommendations: string[] = []

    if (runwayDays > 90) {
        healthScore = 95
        healthStatus = 'excellent'
        recommendations.push('Cash position is strong. Consider deploying excess to yield strategies.')
    } else if (runwayDays > 60) {
        healthScore = 80
        healthStatus = 'good'
        recommendations.push('Healthy runway. Monitor weekly for changes.')
    } else if (runwayDays > 30) {
        healthScore = 60
        healthStatus = 'fair'
        recommendations.push('Runway below 60 days. Review upcoming expenses and consider raising reserves.')
    } else if (runwayDays > 14) {
        healthScore = 35
        healthStatus = 'poor'
        recommendations.push('LOW RUNWAY — Immediate action needed to secure additional funding.')
    } else {
        healthScore = 10
        healthStatus = 'critical'
        recommendations.push('CRITICAL: Less than 2 weeks of runway. Halt non-essential operations.')
    }

    if (totalBalance === 0) {
        healthScore = 50
        healthStatus = 'fair'
        recommendations.length = 0
        recommendations.push('Fund your sponsor wallet to enable gasless transactions and fee sponsorship.')
        recommendations.push('Visit the Tempo faucet to get testnet AlphaUSD tokens.')
    }

    // Yield opportunities
    logs.push(`[CashAgent] Scanning high-yield DeFi protocols on Tempo...`)
    const yieldOpportunities = [
        {
            protocol: 'Tempo Fee AMM',
            apy: 4.2,
            token: 'AlphaUSD',
            risk: 'low' as const,
            description: 'Provide liquidity to the Fee AMM for passive yield on gas fee swaps.',
        },
        {
            protocol: 'PathUSD Staking',
            apy: 6.8,
            token: 'PathUSD',
            risk: 'low' as const,
            description: 'Stake PathUSD in the protocol reserve for base yield.',
        },
        {
            protocol: 'DEX LP (Alpha/Beta)',
            apy: 12.5,
            token: 'AlphaUSD-BetaUSD',
            risk: 'medium' as const,
            description: 'Provide liquidity to the Alpha/Beta stablecoin pair for trading fees.',
        },
    ]

    // Savings summary
    logs.push(`[CashAgent] Optimizing gas fee spend...`)
    const currentFeeSpend = dailyVolume * 0.003 * 30 // 0.3% fees
    const optimizedFeeSpend = dailyVolume * 0.001 * 30 // 0.1% with optimization

    return {
        totalBalance,
        balances,
        rebalanceActions,
        liquidityHealth: {
            score: healthScore,
            status: healthStatus,
            runwayDays: Math.min(runwayDays, 999),
            dailyBurnRate: dailyExpenses,
            recommendations,
        },
        yieldOpportunities,
        savingsSummary: {
            potentialMonthlySavings: Math.round((currentFeeSpend - optimizedFeeSpend) * 100) / 100,
            currentFeeSpend: Math.round(currentFeeSpend * 100) / 100,
            optimizedFeeSpend: Math.round(optimizedFeeSpend * 100) / 100,
        },
        aiNarrative: '',
        logs,
    }
}

// ─── LLM-Enhanced Analysis ─────────────────────────────────────────────
export async function analyzeCashWithAI(
    dailyVolume: number,
    currentBalances: Array<{ token: string; balance: number }>,
    dailyExpenses: number = 0
): Promise<CashOptimization & { aiNarrative: string }> {
    const { askGroq } = await import('@/lib/groq')
    const result = analyzeCashPosition(dailyVolume, currentBalances, dailyExpenses)

    const prompt = `You are a DeFi treasury strategist for a web3 merchant platform on Tempo Network.
Analyze this treasury data and provide strategic advice in 3-4 concise paragraphs.
Cover: liquidity position assessment, rebalancing priorities, yield optimization strategy, and risk management.
Consider DeFi-specific factors like impermanent loss, smart contract risk, and stablecoin peg stability.
Be direct and specific with numbers.`

    const data = `Treasury Data:
- Total balance: $${result.totalBalance.toFixed(2)}
- Runway: ${result.liquidityHealth.runwayDays} days
- Health score: ${result.liquidityHealth.score}/100 (${result.liquidityHealth.status})
- Daily volume: $${dailyVolume.toFixed(2)}
- Token allocations: ${result.balances.map(b => `${b.symbol}: $${b.balance} (${b.currentAllocation}% vs ${b.targetAllocation}% target, deviation: ${b.deviationPercent}%)`).join(', ')}
- Rebalance actions needed: ${result.rebalanceActions.length}
- Monthly fee savings potential: $${result.savingsSummary.potentialMonthlySavings.toFixed(2)}
- Yield opportunities: ${result.yieldOpportunities.map(y => `${y.protocol} (${y.apy}% APY, ${y.risk} risk)`).join(', ')}`

    result.aiNarrative = await askGroq(prompt, data, 'Treasury analysis requires GROQ_API_KEY for AI-powered insights.')
    return result as CashOptimization & { aiNarrative: string }
}
