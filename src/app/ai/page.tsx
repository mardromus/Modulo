"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AgentTerminal from "@/components/AgentTerminal";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function AIInsightsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<"overview" | "revenue" | "pricing" | "cash" | "growth" | "logs">("overview");

    // Simulated startup logs
    useEffect(() => {
        if (!loading) return;

        const startupLogs = [
            "[System] Initializing Modulo v2.0...",
            "[System] Connecting to Tempo Testnet RPC...",
            "[Auth] Verifying Privy session...",
            "[Revenue] Requesting transaction history from indexer...",
            "[Pricing] Scanning product catalog...",
            "[Pricing] Fetching competitor volume data...",
            "[Cash] auditing treasury wallet balances...",
            "[AI] Warming up Groq inference engine (Llama-3-70b)...",
            "[System] All agents ready. Executing parallel analysis...",
            "[Revenue] Analyzing daily patterns...",
            "[Business] Generating growth strategies..."
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < startupLogs.length) {
                setLogs(prev => [...prev, startupLogs[i]]);
                i++;
            }
        }, 800);

        return () => clearInterval(interval);
    }, [loading]);

    useEffect(() => { fetchInsights(); }, []);

    async function fetchInsights() {
        setLoading(true);
        setLogs([]); // Reset logs on refresh
        try {
            const res = await fetch("/api/ai/insights");
            const json = await res.json();
            setData(json);

            // Merge backend logs
            const backendLogs = [
                ...(json.revenue?.logs || []),
                ...(json.pricing?.logs || []),
                ...(json.cash?.logs || []),
                ...(json.business?.logs || [])
            ];

            // Add a small delay to transition from simulated logs to real ones if needed, 
            // but for now we'll just append them after loading finishes styling handles the jump.
            setLogs(prev => [...prev, ...backendLogs, "[System] Analysis complete. Dashboard updated."]);

        } catch (e) {
            console.error("Failed to fetch insights:", e);
            setLogs(prev => [...prev, `[ERROR] Connection failed: ${e}`]);
        }
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="page">
                <div className="container" style={{ paddingTop: 48 }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 700, textAlign: "center", marginBottom: 20 }}>
                        <span className="gradient-text">Agent Neural Network Active</span>
                    </h2>
                    <AgentTerminal logs={logs} height="400px" title="AGENT_LIVE_FEED" />
                    <div style={{ textAlign: "center", marginTop: 20, color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                        Processing real-time on-chain data...
                    </div>
                </div>
            </div>
        );
    }

    if (!data || data.error) {
        return (
            <div className="page">
                <div className="container" style={{ paddingTop: 48 }}>
                    <div className="card" style={{ textAlign: "center", padding: 40 }}>
                        <h2 style={{ fontSize: "1.1rem" }}>Could Not Load Insights</h2>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 6 }}>{data?.error || "Check your connection"}</p>
                        <button className="btn-primary" style={{ marginTop: 14 }} onClick={fetchInsights}>Retry</button>
                    </div>
                </div>
            </div>
        );
    }
    const { revenue, pricing, cash, business } = data;
    const tabs = ["overview", "revenue", "pricing", "cash", "growth", "logs"];

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}><span className="gradient-text">AI Command Center</span></h1>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 2 }}>Entrepreneurial intelligence powered by 9 autonomous agents</p>
                    </div>
                    <button className="btn-ghost" onClick={fetchInsights}>Refresh</button>
                </div>

                {/* Health Banner */}
                <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, padding: "20px 24px" }}>
                    <div>
                        <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 3 }}>Business Health</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                            <span className="gradient-text" style={{ fontSize: "2.5rem", fontWeight: 900 }}>{business.score}</span>
                            <span style={{ fontSize: "1.2rem", fontWeight: 700, color: business.score >= 80 ? "var(--green)" : business.score >= 50 ? "var(--text-secondary)" : "var(--red)" }}>{business.grade}</span>
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: 2, maxWidth: 440 }}>{business.summary}</p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, textAlign: "center" }}>
                        <Metric label="Avg CLV" value={`$${business.metrics.customerLifetimeValue.toFixed(0)}`} />
                        <Metric label="MRR" value={`$${business.metrics.monthlyRecurringRevenue.toFixed(0)}`} color="var(--green)" />
                        <Metric label="NRR" value={`${business.metrics.netRevenueRetention}%`} color="var(--yellow)" />
                        <Metric label="Payback" value={`${business.metrics.paybackPeriodMonths}mo`} />
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: "1px solid var(--border)" }}>
                    {tabs.map((t) => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t as any)}
                            style={{
                                padding: "8px 16px",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "0.82rem",
                                fontWeight: 600,
                                background: "transparent",
                                color: activeTab === t ? "var(--text-primary)" : "var(--text-muted)",
                                borderBottom: activeTab === t ? "2px solid var(--accent)" : "2px solid transparent",
                                marginBottom: -1,
                                transition: "all 0.15s",
                                textTransform: "capitalize",
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === "overview" && <OverviewTab business={business} revenue={revenue} cash={cash} />}
                {activeTab === "revenue" && <RevenueTab revenue={revenue} />}
                {activeTab === "pricing" && <PricingTab pricing={pricing} />}
                {activeTab === "cash" && <CashTab cash={cash} />}
                {activeTab === "growth" && <GrowthTab business={business} />}
                {activeTab === "logs" && (
                    <div>
                        <AgentTerminal logs={logs} height="500px" title="FULL_EXECUTION_TRACE" />
                    </div>
                )}
            </div>
        </div>
    );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: color || "var(--text-primary)" }}>{value}</div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{label}</div>
        </div>
    );
}

function AINarrative({ text, title = "AI Strategic Analysis" }: { text: string; title?: string }) {
    if (!text || text.includes('requires GROQ_API_KEY') || text.includes('unavailable')) {
        return (
            <div className="card" style={{ borderLeft: "3px solid var(--border-hover)", marginTop: 12, marginBottom: 12 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 6, color: "var(--text-muted)" }}>{title}</div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                    Add a GROQ_API_KEY to your .env file to enable AI-powered strategic analysis.
                </p>
            </div>
        );
    }
    return (
        <div className="card" style={{ borderLeft: "3px solid var(--accent)", marginTop: 12, marginBottom: 12 }}>
            <div className="gradient-text" style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 8 }}>{title}</div>
            {text.split("\n\n").map((para, i) => (
                <p key={i} style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: i < text.split("\n\n").length - 1 ? 10 : 0 }}>
                    {para}
                </p>
            ))}
        </div>
    );
}

// ─── Overview ─────────────────────────────────────────
function OverviewTab({ business, revenue, cash }: any) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="card">
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 14 }}>Competitive Advantages</h3>
                {business.competitiveEdges.map((e: any, i: number) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>{e.strength}</span>
                            <span style={{ fontSize: "0.72rem", fontWeight: 700 }}>{e.score}/10</span>
                        </div>
                        <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}>
                            <div style={{ height: "100%", borderRadius: 2, width: `${e.score * 10}%`, background: "var(--accent)", transition: "width 0.4s" }} />
                        </div>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 3 }}>{e.description}</p>
                    </div>
                ))}
            </div>

            <div className="card">
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 14 }}>Priority Action Plan</h3>
                {business.actionPlan.map((a: any) => (
                    <div key={a.priority} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: a.priority <= 2 ? "var(--accent)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                            {a.priority}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{a.action}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{a.expectedOutcome} · {a.deadline}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card" style={{ gridColumn: "span 2" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 14 }}>AI Insights</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
                    {revenue.insights.map((ins: any, i: number) => (
                        <div key={i} style={{ padding: 14, borderRadius: 8, border: `1px solid ${ins.type === "positive" ? "rgba(52,211,153,0.2)" : ins.type === "negative" ? "rgba(248,113,113,0.2)" : "var(--border)"}` }}>
                            <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: 4 }}>{ins.metric}</div>
                            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 4 }}>{ins.description}</p>
                            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic" }}>{ins.recommendation}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card" style={{ gridColumn: "span 2" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 10 }}>Liquidity Health</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", border: `3px solid ${cash.liquidityHealth.score >= 70 ? "var(--green)" : cash.liquidityHealth.score >= 40 ? "var(--yellow)" : "var(--red)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: 800, flexShrink: 0 }}>
                        {cash.liquidityHealth.score}
                    </div>
                    <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, textTransform: "capitalize" }}>{cash.liquidityHealth.status}</div>
                        {cash.liquidityHealth.recommendations.map((r: string, i: number) => (
                            <p key={i} style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 3 }}>{r}</p>
                        ))}
                    </div>
                </div>
            </div>

            <AINarrative text={business.aiNarrative} title="AI Executive Briefing" />
        </div>
    );
}

// ─── Revenue ──────────────────────────────────────────
function RevenueTab({ revenue }: any) {
    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                {[
                    { l: "This Month", v: `$${revenue.currentMonthRevenue.toFixed(2)}` },
                    { l: "Last Month", v: `$${revenue.previousMonthRevenue.toFixed(2)}`, c: "var(--text-secondary)" },
                    { l: "Growth", v: `${revenue.growthRate >= 0 ? "+" : ""}${revenue.growthRate}%`, c: revenue.growthRate >= 0 ? "var(--green)" : "var(--red)" },
                    { l: "Projected", v: `$${revenue.projectedMonthlyRevenue.toFixed(2)}`, c: "var(--yellow)" },
                ].map((s) => (
                    <div key={s.l} className="card count-up" style={{ textAlign: "center", padding: "16px 12px" }}>
                        <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 6 }}>{s.l}</div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: s.c || "var(--text-primary)" }}>{s.v}</div>
                    </div>
                ))}
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 14 }}>7-Day Revenue Forecast</h3>
                <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 160 }}>
                    {revenue.forecasts.map((f: any) => {
                        const max = Math.max(...revenue.forecasts.map((x: any) => x.upperBound), 1);
                        const h = (f.predicted / max) * 130;
                        return (
                            <div key={f.period} style={{ flex: 1, textAlign: "center" }}>
                                <div style={{ background: "var(--accent)", opacity: f.confidence, height: Math.max(6, h), borderRadius: "4px 4px 0 0", marginBottom: 4, position: "relative" }}>
                                    <span style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", fontSize: "0.6rem", fontWeight: 700, whiteSpace: "nowrap" }}>${f.predicted.toFixed(0)}</span>
                                </div>
                                <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{new Date(f.period).toLocaleDateString("en", { weekday: "short" })}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="card">
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 3 }}>Best Revenue Day</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--green)" }}>${revenue.bestDay.revenue.toFixed(2)}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{revenue.bestDay.day}</div>
                </div>
                <div className="card">
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 3 }}>Lowest Revenue Day</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--red)" }}>${revenue.worstDay.revenue.toFixed(2)}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{revenue.worstDay.day}</div>
                </div>
            </div>

            <AINarrative text={revenue.aiNarrative} title="AI Revenue Analysis" />
        </div>
    );
}

// ─── Pricing ──────────────────────────────────────────
function PricingTab({ pricing }: any) {
    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 6 }}>Price Elasticity</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>{pricing.elasticityScore.toFixed(2)}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{pricing.elasticityScore > -1 ? "Inelastic (can raise)" : "Elastic (price-sensitive)"}</div>
                </div>
                <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 6 }}>Optimal Range</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--green)" }}>${pricing.optimalPriceRange.min} — ${pricing.optimalPriceRange.max}</div>
                </div>
                <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 6 }}>Revenue-Max Price</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--yellow)" }}>${pricing.revenueMaximizingPrice}</div>
                </div>
            </div>

            <div className="card">
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 14 }}>Pricing Recommendations</h3>
                {pricing.recommendations.map((rec: any) => (
                    <div key={rec.productId} style={{ padding: 14, borderRadius: 8, border: "1px solid var(--border)", marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div>
                                <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>{rec.productName}</span>
                                <span className={`badge ${rec.strategy === "increase" ? "badge-success" : "badge-pending"}`} style={{ marginLeft: 6 }}>{rec.strategy}</span>
                            </div>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Confidence: {(rec.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                            <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>${rec.currentPrice}</span>
                            <span style={{ color: "var(--text-muted)" }}>→ </span>
                            <span style={{ fontSize: "1.2rem", fontWeight: 800, color: rec.strategy === "increase" ? "var(--green)" : "var(--yellow)" }}>${rec.suggestedPrice}</span>
                            <span style={{ fontSize: "0.8rem", color: rec.changePercent >= 0 ? "var(--green)" : "var(--red)" }}>({rec.changePercent >= 0 ? "+" : ""}{rec.changePercent}%)</span>
                        </div>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{rec.reason}</p>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: 3 }}>{rec.expectedImpact}</p>
                    </div>
                ))}
            </div>

            <AINarrative text={pricing.aiNarrative} title="AI Pricing Strategy" />
        </div>
    );
}

// ─── Cash / Treasury ──────────────────────────────────
function CashTab({ cash }: any) {
    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 6 }}>Total Balance</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>${cash.totalBalance.toFixed(2)}</div>
                </div>
                <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 6 }}>Runway</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: cash.liquidityHealth.runwayDays > 60 ? "var(--green)" : "var(--yellow)" }}>{cash.liquidityHealth.runwayDays} days</div>
                </div>
                <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 6 }}>Monthly Savings</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--green)" }}>${cash.savingsSummary.potentialMonthlySavings.toFixed(2)}</div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 14 }}>Token Allocations</h3>
                {cash.balances.map((bal: any) => (
                    <div key={bal.token} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontWeight: 600, fontSize: "0.82rem" }}>{bal.symbol}</span>
                            <div style={{ fontSize: "0.78rem" }}>
                                <span style={{ color: "var(--text-secondary)" }}>${bal.balance} </span>
                                <span style={{ color: Math.abs(bal.deviationPercent) > 10 ? "var(--red)" : "var(--green)", fontWeight: 600 }}>
                                    ({bal.deviationPercent >= 0 ? "+" : ""}{bal.deviationPercent}% vs target)
                                </span>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 3, height: 6, borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${bal.currentAllocation}%`, background: "var(--accent)", borderRadius: 3 }} />
                            <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 3 }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", color: "var(--text-muted)", marginTop: 2 }}>
                            <span>Current: {bal.currentAllocation}%</span>
                            <span>Target: {bal.targetAllocation}%</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 14 }}>Yield Opportunities</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                    {cash.yieldOpportunities.map((opp: any, i: number) => (
                        <div key={i} style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <span style={{ fontWeight: 700, fontSize: "0.82rem" }}>{opp.protocol}</span>
                                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--green)" }}>{opp.apy}% APY</span>
                            </div>
                            <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginBottom: 4 }}>{opp.description}</p>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Token: {opp.token}</span>
                                <span className={`badge ${opp.risk === "low" ? "badge-success" : "badge-pending"}`}>{opp.risk} risk</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {cash.rebalanceActions.length > 0 && (
                <div className="card">
                    <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 14 }}>Rebalance Suggestions</h3>
                    {cash.rebalanceActions.map((a: any, i: number) => (
                        <div key={i} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 8, marginBottom: 6 }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{a.fromToken} → {a.toToken}</span>
                                <span className={`badge ${a.urgency === "high" ? "badge-failed" : "badge-pending"}`}>{a.urgency}</span>
                            </div>
                            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 3 }}>{a.reason}</p>
                        </div>
                    ))}
                </div>
            )}

            <AINarrative text={cash.aiNarrative} title="AI Treasury Strategy" />
        </div>
    );
}

// ─── Growth ───────────────────────────────────────────
function GrowthTab({ business }: any) {
    return (
        <div>
            <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 14 }}>Customer Segments</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
                    {business.customerSegments.map((seg: any, i: number) => (
                        <div key={i} style={{ padding: 14, borderRadius: 8, border: `1px solid ${seg.churnRisk === "high" ? "rgba(248,113,113,0.2)" : seg.churnRisk === "medium" ? "rgba(250,204,21,0.2)" : "rgba(52,211,153,0.2)"}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>{seg.name}</span>
                                <span className={`badge ${seg.churnRisk === "low" ? "badge-success" : seg.churnRisk === "high" ? "badge-failed" : "badge-pending"}`}>{seg.churnRisk} churn</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                                <div><div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Size</div><div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{seg.size}</div></div>
                                <div><div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Avg Spend</div><div style={{ fontWeight: 700, fontSize: "0.88rem" }}>${seg.avgSpend.toFixed(0)}</div></div>
                            </div>
                            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic" }}>{seg.strategy}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card">
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 14 }}>Growth Opportunities</h3>
                {business.growthOpportunities.map((opp: any, i: number) => (
                    <div key={i} style={{ padding: 14, borderRadius: 8, border: "1px solid var(--border)", marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                            <div>
                                <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>{opp.title}</span>
                                <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                                    <span className="badge" style={{ fontSize: "0.62rem" }}>{opp.category}</span>
                                    <span className={`badge ${opp.impact === "high" ? "badge-success" : "badge-pending"}`} style={{ fontSize: "0.62rem" }}>{opp.impact} impact</span>
                                    <span className="badge" style={{ fontSize: "0.62rem" }}>{opp.effort} effort</span>
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--green)" }}>+${opp.estimatedRevenue.toFixed(0)}</div>
                                <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{opp.timeToValue}</div>
                            </div>
                        </div>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{opp.description}</p>
                    </div>
                ))}
            </div>

            <AINarrative text={business.aiNarrative} title="AI Growth Playbook" />
        </div>
    );
}
