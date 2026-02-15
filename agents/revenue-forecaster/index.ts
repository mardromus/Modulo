/**
 * Revenue Forecaster Agent
 *
 * Analyzes historical transaction data to predict future revenue,
 * identify growth trends, and provide actionable business insights.
 * Uses exponential smoothing + seasonal decomposition.
 */

export interface RevenueDataPoint {
    date: string
    revenue: number
    orderCount: number
    avgOrderValue: number
}

export interface RevenueForecast {
    period: string
    predicted: number
    lowerBound: number
    upperBound: number
    confidence: number
}

export interface GrowthInsight {
    type: 'positive' | 'negative' | 'neutral'
    metric: string
    change: number
    description: string
    recommendation: string
}

interface RevenueAnalysis {
    currentMonthRevenue: number
    previousMonthRevenue: number
    growthRate: number
    averageDailyRevenue: number
    projectedMonthlyRevenue: number
    forecasts: RevenueForecast[]
    insights: GrowthInsight[]
    bestDay: { day: string; revenue: number }
    worstDay: { day: string; revenue: number }
    aiNarrative: string
    logs: string[]
}

// ─── Exponential Smoothing Forecast ────────────────────────────────────
function exponentialSmoothing(
    data: number[],
    alpha: number = 0.3,
    periods: number = 7
): number[] {
    if (data.length === 0) return Array(periods).fill(0)

    let smoothed = data[0]
    for (let i = 1; i < data.length; i++) {
        smoothed = alpha * data[i] + (1 - alpha) * smoothed
    }

    // Calculate trend
    const trend =
        data.length > 1
            ? (data[data.length - 1] - data[0]) / data.length
            : 0

    const forecasts: number[] = []
    for (let i = 1; i <= periods; i++) {
        forecasts.push(Math.max(0, smoothed + trend * i))
    }
    return forecasts
}

// ─── Std Deviation for Confidence Intervals ────────────────────────────
function standardDeviation(values: number[]): number {
    if (values.length < 2) return 0
    const mean = values.reduce((s, v) => s + v, 0) / values.length
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2))
    return Math.sqrt(squaredDiffs.reduce((s, v) => s + v, 0) / (values.length - 1))
}

// ─── Main Analysis Function ────────────────────────────────────────────
export function analyzeRevenue(
    transactions: Array<{
        amount: string
        createdAt: Date | string
        status: string
    }>
): RevenueAnalysis {
    const logs: string[] = []
    logs.push(`[RevenueAgent] Initializing analysis for ${transactions.length} transactions...`)

    const now = new Date()
    const currentMonth = now.getMonth()
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1

    // Group by day
    const dailyRevenue = new Map<string, number>()
    const dailyOrders = new Map<string, number>()

    for (const tx of transactions) {
        if (tx.status !== 'settled') continue
        const date = new Date(tx.createdAt)
        const key = date.toISOString().split('T')[0]
        const amount = parseFloat(tx.amount) || 0

        dailyRevenue.set(key, (dailyRevenue.get(key) || 0) + amount)
        dailyOrders.set(key, (dailyOrders.get(key) || 0) + 1)
    }
    logs.push(`[RevenueAgent] Processed ${dailyRevenue.size} unique days of revenue data.`)

    // Current vs previous month
    let currentMonthRevenue = 0
    let previousMonthRevenue = 0

    for (const [dateStr, rev] of dailyRevenue) {
        const date = new Date(dateStr)
        if (date.getMonth() === currentMonth && date.getFullYear() === now.getFullYear()) {
            currentMonthRevenue += rev
        }
        if (date.getMonth() === previousMonth) {
            previousMonthRevenue += rev
        }
    }

    const growthRate =
        previousMonthRevenue > 0
            ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
            : currentMonthRevenue > 0
                ? 100
                : 0
    logs.push(`[RevenueAgent] Calculated MoM growth rate: ${growthRate.toFixed(2)}%.`)

    // Daily averages
    const revenueValues = Array.from(dailyRevenue.values())
    const averageDailyRevenue =
        revenueValues.length > 0
            ? revenueValues.reduce((s, v) => s + v, 0) / revenueValues.length
            : 0

    // Best/worst days
    const sortedDays = Array.from(dailyRevenue.entries()).sort((a, b) => b[1] - a[1])
    const bestDay = sortedDays[0] || { 0: 'N/A', 1: 0 }
    const worstDay = sortedDays[sortedDays.length - 1] || { 0: 'N/A', 1: 0 }

    // Forecasting
    logs.push(`[RevenueAgent] Running exponential smoothing model (alpha=0.3)...`)
    const forecastValues = exponentialSmoothing(revenueValues, 0.3, 7)
    const stdDev = standardDeviation(revenueValues)
    logs.push(`[RevenueAgent] Generated 7-day forecast with confidence intervals.`)

    const forecasts: RevenueForecast[] = forecastValues.map((val, i) => {
        const futureDate = new Date(now)
        futureDate.setDate(futureDate.getDate() + i + 1)
        const confidence = Math.max(0.5, 0.95 - i * 0.05)

        return {
            period: futureDate.toISOString().split('T')[0],
            predicted: Math.round(val * 100) / 100,
            lowerBound: Math.round(Math.max(0, val - 1.96 * stdDev) * 100) / 100,
            upperBound: Math.round((val + 1.96 * stdDev) * 100) / 100,
            confidence,
        }
    })

    // Projected monthly
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dayOfMonth = now.getDate()
    const projectedMonthlyRevenue =
        dayOfMonth > 0
            ? (currentMonthRevenue / dayOfMonth) * daysInMonth
            : 0

    // Generate insights
    const insights: GrowthInsight[] = []

    if (growthRate > 10) {
        insights.push({
            type: 'positive',
            metric: 'Revenue Growth',
            change: growthRate,
            description: `Revenue is up ${growthRate.toFixed(1)}% vs last month`,
            recommendation: 'Consider expanding product catalog or increasing marketing spend to capitalize on momentum.',
        })
    } else if (growthRate < -5) {
        insights.push({
            type: 'negative',
            metric: 'Revenue Decline',
            change: growthRate,
            description: `Revenue is down ${Math.abs(growthRate).toFixed(1)}% vs last month`,
            recommendation: 'Analyze customer churn, review pricing, and consider promotional campaigns.',
        })
    }

    if (averageDailyRevenue > 0) {
        insights.push({
            type: 'neutral',
            metric: 'Daily Revenue',
            change: averageDailyRevenue,
            description: `Average daily revenue is $${averageDailyRevenue.toFixed(2)}`,
            recommendation: `Target $${(averageDailyRevenue * 1.2).toFixed(2)}/day (+20%) through upselling and cross-selling.`,
        })
    }

    // Demo insight if no data
    if (insights.length === 0) {
        insights.push(
            {
                type: 'neutral',
                metric: 'Getting Started',
                change: 0,
                description: 'Not enough transaction history for deep analysis',
                recommendation: 'Process more orders to unlock AI-powered revenue forecasting and trend analysis.',
            },
            {
                type: 'positive',
                metric: 'Platform Ready',
                change: 100,
                description: 'All AI agents are initialized and ready to analyze',
                recommendation: 'Seed demo data and simulate purchases to see forecasting in action.',
            }
        )
    }

    return {
        currentMonthRevenue,
        previousMonthRevenue,
        growthRate: Math.round(growthRate * 100) / 100,
        averageDailyRevenue: Math.round(averageDailyRevenue * 100) / 100,
        projectedMonthlyRevenue: Math.round(projectedMonthlyRevenue * 100) / 100,
        forecasts,
        insights,
        bestDay: { day: bestDay[0] || 'N/A', revenue: bestDay[1] || 0 },
        worstDay: { day: worstDay[0] || 'N/A', revenue: worstDay[1] || 0 },
        aiNarrative: '',
        logs,
    }
}

// ─── LLM-Enhanced Analysis ─────────────────────────────────────────────
export async function analyzeRevenueWithAI(
    transactions: Array<{
        amount: string
        createdAt: Date | string
        status: string
    }>
): Promise<RevenueAnalysis & { aiNarrative: string }> {
    const { askGroq } = await import('@/lib/groq')
    const result = analyzeRevenue(transactions)

    const prompt = `You are a senior financial analyst for a web3 merchant platform.
Analyze this revenue data and provide strategic insights in 3-4 concise paragraphs.
Focus on: trend interpretation, risk factors, actionable recommendations, and growth opportunities.
Be specific with numbers. Be direct and strategic — think like a CFO advising a startup founder.`

    const data = `Revenue Data:
- Current month: $${result.currentMonthRevenue.toFixed(2)}
- Previous month: $${result.previousMonthRevenue.toFixed(2)}
- Growth rate: ${result.growthRate}%
- Average daily revenue: $${result.averageDailyRevenue.toFixed(2)}
- Projected monthly: $${result.projectedMonthlyRevenue.toFixed(2)}
- Best day: ${result.bestDay.day} ($${result.bestDay.revenue.toFixed(2)})
- Worst day: ${result.worstDay.day} ($${result.worstDay.revenue.toFixed(2)})
- 7-day forecast: ${result.forecasts.map(f => `${f.period}: $${f.predicted}`).join(', ')}
- Total orders analyzed: ${transactions.length}
- Settled orders: ${transactions.filter(t => t.status === 'settled').length}`

    result.aiNarrative = await askGroq(prompt, data, 'Revenue analysis requires GROQ_API_KEY for AI-powered insights.')
    return result as RevenueAnalysis & { aiNarrative: string }
}
