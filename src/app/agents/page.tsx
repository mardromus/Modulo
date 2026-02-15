import Link from "next/link";

export default function AgentsPage() {
    const agents = [
        {
            name: "SmartSplit",
            status: "active",
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M9 21H4v-5" /></svg>,
            description: "Computes multi-party payment splits and executes atomic batch transactions.",
            features: ["Atomic batch execution", "Rounding dust handling", "Memo format: order:<id>:split:v1", "Sequential fallback for Privy"],
            endpoint: "/api/checkout/execute",
        },
        {
            name: "Reconciliation",
            status: "active",
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
            description: "Watches TransferWithMemo events on-chain and matches them to orders for automatic settlement.",
            features: ["TransferWithMemo event listener", "Memo parsing & order matching", "Automatic status updates", "Health monitoring"],
            endpoint: "/api/webhooks/tempo/tx",
        },
        {
            name: "Revenue Forecaster",
            status: "active",
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
            description: "Predicts revenue trends using exponential smoothing and seasonal decomposition.",
            features: ["7-day revenue forecasting", "Confidence intervals (95%)", "Growth rate analysis", "Best/worst day identification"],
            endpoint: "/api/ai/insights",
        },
        {
            name: "Smart Pricing",
            status: "active",
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" /></svg>,
            description: "Calculates price elasticity and recommends optimal pricing strategies.",
            features: ["Elasticity scoring", "Demand curve estimation", "Revenue maximization points", "A/B test suggestions"],
            endpoint: "/api/ai/insights",
        },
        {
            name: "Cash Optimizer",
            status: "active",
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><line x1="16" y1="21" x2="16" y2="2" /><line x1="12" y1="21" x2="12" y2="2" /><line x1="8" y1="21" x2="8" y2="2" /></svg>,
            description: "Manages treasury liquidity and identifies yield opportunities across DeFi.",
            features: ["Runway calculation", "Idle capital detection", "Yield farming scanner", "Rebalancing triggers"],
            endpoint: "/api/ai/insights",
        },
        {
            name: "Fraud Sentinel",
            status: "active",
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
            description: "Analyzes transaction patterns to detect and block suspicious activity pre-settlement.",
            features: ["Velocity checks", "Wallet reputation scoring", "Cross-merchant flagging", "Anomaly detection"],
            endpoint: "/api/ai/risk-check",
        },
        {
            name: "Business Insights",
            status: "active",
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
            description: "Generates executive summaries and strategic action plans from aggregated data.",
            features: ["Cross-agent synthesis", "Natural language reporting", "KPI tracking", "Growth opportunity spotting"],
            endpoint: "/api/ai/insights",
        },
        {
            name: "Subscription Guardian",
            status: "active",
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" /></svg>,
            description: "Recovers failed subscription payments using smart retries and backup wallets.",
            features: ["Exponential backoff retries", "Backup wallet detection", "Dunning management", "Churn prevention"],
            endpoint: "/api/subscriptions/retry",
        },
        {
            name: "Payout Orchestrator",
            status: "active",
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-6M2 12h6M12 2v6M12 22v-6M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" /></svg>,
            description: "Manages bulk payouts via CSV with parallel execution lanes.",
            features: ["CSV parsing & validation", "Parallel nonce management", "Batch execution", "Idempotency keys"],
            endpoint: "/api/payouts/csv",
        },
    ];

    const activeCount = agents.filter((a) => a.status === "active").length;

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                    <div>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                            <span className="gradient-text">Agents</span>
                        </h1>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                            <span className="live-dot" style={{ background: "var(--green)", boxShadow: "0 0 8px var(--green)" }} />
                            {activeCount}/{agents.length} active
                        </p>
                    </div>
                    <Link href="/ai" className="btn-primary" style={{ fontSize: "0.8rem" }}>
                        AI Command Center
                    </Link>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: 14 }}>
                    {agents.map((agent) => (
                        <div key={agent.name} className="card glow-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0, color: "var(--accent)" }}>
                                        {agent.icon}
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{agent.name}</span>
                                </div>
                                <span className={`badge ${agent.status === "active" ? "badge-success" : "badge-pending"}`}>
                                    {agent.status}
                                </span>
                            </div>

                            <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: 1.5, marginBottom: 12 }}>
                                {agent.description}
                            </p>

                            <div style={{ marginBottom: 12 }}>
                                {agent.features.map((f) => (
                                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "var(--text-muted)", padding: "2px 0" }}>
                                        <span style={{ color: agent.status === "active" ? "var(--green)" : "var(--text-muted)" }}>
                                            {agent.status === "active" ? "✓" : "○"}
                                        </span>
                                        {f}
                                    </div>
                                ))}
                            </div>

                            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, fontSize: "0.73rem", color: "var(--text-muted)" }}>
                                Endpoint: <code>{agent.endpoint}</code>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
