/**
 * Business Insights Agent
 *
 * Aggregates data from all other agents to generate a comprehensive
 * entrepreneurial intelligence report: market positioning, customer
 * segmentation, growth opportunities, and competitive strategy.
 */

export interface CustomerSegment {
    name: string
    size: number
    avgSpend: number
    frequency: string
    churnRisk: 'low' | 'medium' | 'high'
    strategy: string
}

export interface GrowthOpportunity {
    title: string
    category: 'product' | 'market' | 'operational' | 'financial'
    impact: 'low' | 'medium' | 'high'
    effort: 'low' | 'medium' | 'high'
    description: string
    estimatedRevenue: number
    timeToValue: string
}

export interface CompetitiveEdge {
    strength: string
    description: string
    score: number // 0-10
}

export interface BusinessReport {
    score: number // 0-100 Business Health Score
    grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F'
    summary: string
    customerSegments: CustomerSegment[]
    growthOpportunities: GrowthOpportunity[]
    competitiveEdges: CompetitiveEdge[]
    actionPlan: Array<{
        priority: number
        action: string
        expectedOutcome: string
        deadline: string
    }>
    metrics: {
        customerLifetimeValue: number
        customerAcquisitionCost: number
        monthlyRecurringRevenue: number
        netRevenueRetention: number
        paybackPeriodMonths: number
    }
    aiNarrative: string
    logs: string[]
}

// ─── Customer Segmentation (RFM Analysis) ──────────────────────────────
function segmentCustomers(
    orders: Array<{
        customerWallet: string | null
        amount: string
        createdAt: Date | string
        status: string
    }>,
    logs: string[]
): CustomerSegment[] {
    const settledOrders = orders.filter((o) => o.status === 'settled' && o.customerWallet)
    logs.push(`[BusinessAgent] Segmenting ${settledOrders.length} unique customers via RFM model...`)

    if (settledOrders.length === 0) {
        return [
            {
                name: 'Early Adopters',
                size: 0,
                avgSpend: 0,
                frequency: 'New',
                churnRisk: 'low',
                strategy: 'Attract first customers with promotional pricing and onboarding incentives.',
            },
        ]
    }

    // Group by wallet
    const walletData = new Map<string, { orders: number; totalSpend: number; lastOrder: Date }>()

    for (const order of settledOrders) {
        const wallet = order.customerWallet!
        const existing = walletData.get(wallet) || { orders: 0, totalSpend: 0, lastOrder: new Date(0) }
        existing.orders++
        existing.totalSpend += parseFloat(order.amount)
        const orderDate = new Date(order.createdAt)
        if (orderDate > existing.lastOrder) existing.lastOrder = orderDate
        walletData.set(wallet, existing)
    }

    const customers = Array.from(walletData.entries())
    const now = Date.now()

    // RFM segmentation
    const segments: CustomerSegment[] = []

    const highValue = customers.filter(([, d]) => d.totalSpend > 500 && d.orders >= 5)
    const regular = customers.filter(([, d]) => d.orders >= 3 && d.totalSpend <= 500)
    const newCustomers = customers.filter(([, d]) => d.orders <= 2)
    const churning = customers.filter(
        ([, d]) => now - d.lastOrder.getTime() > 30 * 24 * 60 * 60 * 1000
    )

    if (highValue.length > 0 || customers.length > 0) {
        segments.push({
            name: 'Champions',
            size: highValue.length,
            avgSpend: highValue.length > 0
                ? highValue.reduce((s, [, d]) => s + d.totalSpend, 0) / highValue.length
                : 0,
            frequency: 'Weekly',
            churnRisk: 'low',
            strategy: 'Reward with exclusive access, early product launches, and loyalty bonuses.',
        })
    }

    segments.push({
        name: 'Regular Buyers',
        size: regular.length,
        avgSpend: regular.length > 0
            ? regular.reduce((s, [, d]) => s + d.totalSpend, 0) / regular.length
            : 0,
        frequency: 'Monthly',
        churnRisk: 'medium',
        strategy: 'Increase engagement with personalized recommendations and volume discounts.',
    })

    segments.push({
        name: 'New Customers',
        size: newCustomers.length,
        avgSpend: newCustomers.length > 0
            ? newCustomers.reduce((s, [, d]) => s + d.totalSpend, 0) / newCustomers.length
            : 0,
        frequency: 'First purchase',
        churnRisk: 'high',
        strategy: 'Focus on onboarding experience, follow-up offers, and reducing friction in checkout.',
    })

    if (churning.length > 0) {
        segments.push({
            name: 'At-Risk',
            size: churning.length,
            avgSpend: churning.reduce((s, [, d]) => s + d.totalSpend, 0) / churning.length,
            frequency: 'Inactive 30+ days',
            churnRisk: 'high',
            strategy: 'Win-back campaigns with time-limited discounts and "we miss you" messaging.',
        })
    }

    return segments
}

// ─── Growth Opportunity Generator ──────────────────────────────────────
function identifyGrowthOpportunities(
    orderCount: number,
    totalRevenue: number,
    productCount: number,
    uniqueCustomers: number
): GrowthOpportunity[] {
    const opportunities: GrowthOpportunity[] = []

    // Product expansion
    if (productCount < 5) {
        opportunities.push({
            title: 'Expand Product Catalog',
            category: 'product',
            impact: 'high',
            effort: 'medium',
            description: `Currently ${productCount} product(s). Adding complementary products could increase average order value by 30-40%.`,
            estimatedRevenue: totalRevenue * 0.35,
            timeToValue: '2-4 weeks',
        })
    }

    // Subscription model
    opportunities.push({
        title: 'Launch Subscription Tiers',
        category: 'product',
        impact: 'high',
        effort: 'high',
        description: 'Convert one-time buyers to recurring subscribers. Use the Subscription Guardian agent for automated renewals.',
        estimatedRevenue: totalRevenue * 0.5,
        timeToValue: '4-6 weeks',
    })

    // Bulk/wholesale
    if (orderCount > 10) {
        opportunities.push({
            title: 'Enterprise Bulk Pricing',
            category: 'market',
            impact: 'medium',
            effort: 'low',
            description: 'Offer volume discounts for B2B customers. Use Payout Orchestrator for bulk settlement.',
            estimatedRevenue: totalRevenue * 0.25,
            timeToValue: '1-2 weeks',
        })
    }

    // Fee optimization
    opportunities.push({
        title: 'Fee Optimization via DEX',
        category: 'financial',
        impact: 'medium',
        effort: 'low',
        description: 'Use Cash Optimizer to rebalance reserves and reduce transaction fees by up to 60%.',
        estimatedRevenue: totalRevenue * 0.02,
        timeToValue: '1 week',
    })

    // Referral program
    opportunities.push({
        title: 'On-Chain Referral Program',
        category: 'market',
        impact: 'high',
        effort: 'medium',
        description: 'Use SmartSplit to automatically allocate referral commissions in each transaction. Zero-fee referral tracking.',
        estimatedRevenue: uniqueCustomers * 50,
        timeToValue: '2-3 weeks',
    })

    // Cross-chain expansion
    opportunities.push({
        title: 'Multi-Stablecoin Acceptance',
        category: 'operational',
        impact: 'medium',
        effort: 'low',
        description: 'Accept AlphaUSD, BetaUSD, and PathUSD. Auto-swap to preferred stablecoin via DEX.',
        estimatedRevenue: totalRevenue * 0.15,
        timeToValue: '1 week',
    })

    return opportunities
}

// ─── Main Business Analysis ────────────────────────────────────────────
export function generateBusinessReport(
    orders: Array<{
        customerWallet: string | null
        amount: string
        createdAt: Date | string
        status: string
    }>,
    productCount: number,
    merchantName: string
): BusinessReport {
    const logs: string[] = []
    logs.push(`[BusinessAgent] Initiating comprehensive business health scan...`)

    const settledOrders = orders.filter((o) => o.status === 'settled')
    const totalRevenue = settledOrders.reduce((s, o) => s + parseFloat(o.amount), 0)
    const uniqueCustomers = new Set(
        settledOrders.filter((o) => o.customerWallet).map((o) => o.customerWallet)
    ).size
    logs.push(`[BusinessAgent] Aggregated inputs: $${totalRevenue.toFixed(2)} revenue from ${uniqueCustomers} customers.`)

    // Calculate metrics
    const clv = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0
    const mrr = totalRevenue / Math.max(1, 1) // Simplified for MVP
    const cac = uniqueCustomers > 0 ? (totalRevenue * 0.1) / uniqueCustomers : 0

    // Business health score
    let score = 50
    if (settledOrders.length > 0) score += 10
    if (settledOrders.length > 10) score += 10
    if (uniqueCustomers > 5) score += 10
    if (productCount > 1) score += 5
    if (totalRevenue > 1000) score += 10
    if (totalRevenue > 5000) score += 5
    score = Math.min(100, score)

    const gradeMap: Record<number, BusinessReport['grade']> = {
        95: 'A+', 85: 'A', 75: 'B+', 65: 'B', 50: 'C', 35: 'D',
    }
    const grade = Object.entries(gradeMap).reverse().find(([threshold]) => score >= Number(threshold))?.[1] || 'F'
    logs.push(`[BusinessAgent] Calculated Business Health Score: ${score}/100 [Grade: ${grade}]`)

    // Generate all components
    const customerSegments = segmentCustomers(orders, logs)
    logs.push(`[BusinessAgent] Identifying growth opportunities...`)
    const growthOpportunities = identifyGrowthOpportunities(
        settledOrders.length,
        totalRevenue,
        productCount,
        uniqueCustomers
    )
    logs.push(`[BusinessAgent] Found ${growthOpportunities.length} high-impact growth opportunities.`)

    const competitiveEdges: CompetitiveEdge[] = [
        {
            strength: 'Instant Settlement',
            description: 'Sub-second stablecoin settlement vs 2-7 day traditional payment processing',
            score: 9,
        },
        {
            strength: 'Atomic Splits',
            description: 'Multi-party revenue distribution in a single transaction — zero reconciliation overhead',
            score: 10,
        },
        {
            strength: 'Gasless UX',
            description: 'Fee sponsorship means zero transaction costs for customers',
            score: 8,
        },
        {
            strength: 'Full Auditability',
            description: 'On-chain memos provide instant, transparent audit trails for every payment',
            score: 9,
        },
        {
            strength: 'AI-Powered Operations',
            description: 'Autonomous agents handle forecasting, pricing, fraud detection, and treasury management',
            score: 8,
        },
    ]

    // Action plan
    const actionPlan = [
        {
            priority: 1,
            action: 'Fund sponsor wallet with testnet AlphaUSD',
            expectedOutcome: 'Enable live gasless transactions',
            deadline: 'Today',
        },
        {
            priority: 2,
            action: 'Process 10+ test orders to train AI agents',
            expectedOutcome: 'Unlock revenue forecasting and pricing optimization',
            deadline: 'This week',
        },
        {
            priority: 3,
            action: 'Launch subscription tier product',
            expectedOutcome: `Estimated +$${(totalRevenue * 0.5).toFixed(2)} MRR`,
            deadline: '2 weeks',
        },
        {
            priority: 4,
            action: 'Enable multi-stablecoin acceptance',
            expectedOutcome: '+15% transaction volume from stablecoin diversity',
            deadline: '3 weeks',
        },
        {
            priority: 5,
            action: 'Deploy on-chain referral program',
            expectedOutcome: `+${Math.max(10, uniqueCustomers * 3)} new customers projected`,
            deadline: '1 month',
        },
    ]

    const summary =
        settledOrders.length > 0
            ? `${merchantName} has processed ${settledOrders.length} orders totaling $${totalRevenue.toFixed(2)} from ${uniqueCustomers} unique customers. Business health: ${grade} (${score}/100).`
            : `${merchantName} is set up and ready to process orders. Complete the action plan below to start generating revenue and unlock AI insights.`

    return {
        score,
        grade,
        summary,
        customerSegments,
        growthOpportunities,
        competitiveEdges,
        actionPlan,
        metrics: {
            customerLifetimeValue: Math.round(clv * 100) / 100,
            customerAcquisitionCost: Math.round(cac * 100) / 100,
            monthlyRecurringRevenue: Math.round(mrr * 100) / 100,
            netRevenueRetention: settledOrders.length > 0 ? 95 : 0,
            paybackPeriodMonths: cac > 0 ? Math.round((cac / (clv / 12)) * 10) / 10 : 0,
        },
        aiNarrative: '',
        logs,
    }
}

// ─── LLM-Enhanced Analysis ─────────────────────────────────────────────
export async function generateBusinessReportWithAI(
    orders: Array<{
        customerWallet: string | null
        amount: string
        createdAt: Date | string
        status: string
    }>,
    productCount: number,
    merchantName: string
): Promise<BusinessReport> {
    const { askGroq } = await import('@/lib/groq')
    const result = generateBusinessReport(orders, productCount, merchantName)

    const prompt = `You are a world-class business strategist and startup advisor.
Generate an executive-level business intelligence briefing in 4-5 concise paragraphs.
Cover: overall health assessment, SWOT highlights, customer strategy, growth playbook, and one bold recommendation.
Be data-driven, specific with numbers, and think like a Y Combinator partner advising a founder.
Do NOT use bullet points — write flowing strategic prose.`

    const data = `Business Intelligence for ${merchantName}:
- Health Score: ${result.score}/100 (Grade: ${result.grade})
- Summary: ${result.summary}
- CLV: $${result.metrics.customerLifetimeValue}, CAC: $${result.metrics.customerAcquisitionCost}
- MRR: $${result.metrics.monthlyRecurringRevenue}, NRR: ${result.metrics.netRevenueRetention}%
- Payback period: ${result.metrics.paybackPeriodMonths} months
- Customer segments: ${result.customerSegments.map(s => `${s.name} (${s.size} customers, $${s.avgSpend.toFixed(0)} avg, ${s.churnRisk} churn)`).join('; ')}
- Top growth opportunities: ${result.growthOpportunities.slice(0, 3).map(g => `${g.title} (+$${g.estimatedRevenue.toFixed(0)}, ${g.impact} impact)`).join('; ')}
- Competitive edges: ${result.competitiveEdges.map(e => `${e.strength} (${e.score}/10)`).join('; ')}
- Products: ${productCount}`

    result.aiNarrative = await askGroq(prompt, data, 'Business analysis requires GROQ_API_KEY for AI-powered insights.')
    return result
}
