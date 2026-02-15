"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { QRModal } from "@/components/PaymentQR";

interface OrderData {
    id: string;
    status: string;
    amount: string;
    currency: string;
    createdAt: string;
    product?: { name: string; splitJson?: string };
    latestRun?: { createdAt: string };
}

interface PartnerBalance {
    address: string;
    label: string;
    amount: number;
}

interface Stats {
    totalOrders: number;
    settledOrders: number;
    failedOrders: number;
    pendingOrders: number;
}

interface SponsorData {
    sponsor: { address: string; explorerUrl: string };
    stats: Stats;
    recentTransactions: Array<{
        id: string;
        to: string;
        amount: string;
        txHash: string;
        memo: string;
        status: string;
        explorerUrl: string;
        createdAt: string;
    }>;
}

export default function DashboardPage() {
    const { isLoggedIn, walletAddress, login, ready, user, displayName } = useAuth();
    const [data, setData] = useState<SponsorData | null>(null);
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [partnerBalances, setPartnerBalances] = useState<PartnerBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState<string | null>(null);
    const [qrOrder, setQrOrder] = useState<OrderData | null>(null);
    const [result, setResult] = useState<{
        success: boolean;
        txHash?: string;
        explorerUrl?: string;
        error?: string;
        splits?: Array<{ to: string; amount: string; label: string; percent: number }>;
    } | null>(null);

    useEffect(() => { loadDashboard(); }, [user?.id]);

    async function loadDashboard() {
        setLoading(true);
        try {
            if (!user?.id) return;
            const [sponsorRes, merchantRes] = await Promise.all([
                fetch("/api/admin/sponsor/status").then((r) => r.ok ? r.json() : null),
                fetch(`/api/merchants?privyId=${user.id}`).then((r) => r.ok ? r.json() : null),
            ]);
            if (sponsorRes) setData(sponsorRes);
            if (merchantRes?.merchants?.[0]) {
                const merchant = merchantRes.merchants[0];
                const ordersRes = await fetch(`/api/merchants/${merchant.id}/orders`).catch(() => null);
                if (ordersRes?.ok) {
                    const ordersData = await ordersRes.json();
                    const fetchedOrders = ordersData.orders || [];
                    setOrders(fetchedOrders);
                    calculatePartnerBalances(fetchedOrders);
                }
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    function calculatePartnerBalances(orders: OrderData[]) {
        const balances: Record<string, PartnerBalance> = {};

        orders.filter(o => o.status === "settled").forEach(order => {
            if (!order.product?.splitJson) return;
            try {
                const splits = JSON.parse(order.product.splitJson);
                const orderAmount = Number(order.amount);

                splits.forEach((split: { address: string; percent: number; label: string }) => {
                    const key = split.address;
                    if (!balances[key]) {
                        balances[key] = { address: key, label: split.label, amount: 0 };
                    }
                    balances[key].amount += (orderAmount * split.percent) / 100;
                });
            } catch (e) { console.error("Failed to parse splitJson", e); }
        });

        setPartnerBalances(Object.values(balances).sort((a, b) => b.amount - a.amount));
    }

    function getLatency(order: OrderData) {
        if (!order.latestRun?.createdAt) return "—";
        const start = new Date(order.createdAt).getTime();
        const end = new Date(order.latestRun.createdAt).getTime();
        const diffSeconds = Math.round((end - start) / 1000);
        return diffSeconds < 60 ? `${diffSeconds}s` : `${Math.round(diffSeconds / 60)}m`;
    }

    async function executeOrder(orderId: string) {
        setExecuting(orderId);
        setResult(null);
        try {
            const res = await fetch("/api/checkout/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });
            const resData = await res.json();
            setResult(resData);
            loadDashboard();
        } catch (e) {
            setResult({ success: false, error: String(e) });
        }
        setExecuting(null);
    }

    async function handleSimulatePurchase() {
        const pendingOrder = orders.find((o) => o.status === "pending");
        if (pendingOrder) {
            await executeOrder(pendingOrder.id);
        } else {
            try {
                const seedRes = await fetch("/api/seed");
                if (seedRes.ok) {
                    const seedData = await seedRes.json();
                    if (seedData.seeded?.orderId) {
                        await executeOrder(seedData.seeded.orderId);
                    }
                }
            } catch (e) {
                setResult({ success: false, error: "Failed to seed data" });
            }
        }
    }

    const stats = data?.stats || { totalOrders: 0, settledOrders: 0, failedOrders: 0, pendingOrders: 0 };
    const settled = stats.settledOrders;
    const total = stats.totalOrders;
    const successRate = total > 0 ? Math.round((settled / total) * 100) : 0;

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                    <div>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                            <span className="gradient-text">Dashboard</span>
                        </h1>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 2 }}>
                            Monitor orders, agents, and settlements
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <Link href="/api/seed" className="btn-ghost">Seed Data</Link>
                        <Link href="/payouts" className="btn-secondary" style={{ fontSize: "0.8rem" }}>CSV Payouts</Link>
                        <Link href="/products/new" className="btn-primary" style={{ fontSize: "0.8rem" }}>+ New Product</Link>
                    </div>
                </div>

                {/* Wallet */}
                {ready && (
                    <div className="card" style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        {isLoggedIn ? (
                            <>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 8px var(--green)" }} />
                                    <div>
                                        <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>Connected as {displayName}</div>
                                        <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 1 }}>{walletAddress}</div>
                                    </div>
                                </div>
                                <a href={`https://explore.tempo.xyz/address/${walletAddress}`} target="_blank" rel="noopener" className="btn-ghost" style={{ fontSize: "0.78rem" }}>
                                    Explorer ↗
                                </a>
                            </>
                        ) : (
                            <>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--yellow)" }} />
                                    <div>
                                        <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>Wallet Not Connected</div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Connect for live Tempo transactions</div>
                                    </div>
                                </div>
                                <button onClick={login} className="btn-primary" style={{ padding: "6px 16px", fontSize: "0.8rem" }}>Connect</button>
                            </>
                        )}
                    </div>
                )}
                {/* Partner Balances */}
                {partnerBalances.length > 0 && (
                    <>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 12 }}>Partner Balances</h2>
                        <div className="card" style={{ marginBottom: 28 }}>
                            <div className="table-container">
                                <table>
                                    <thead><tr><th>Recipient</th><th>Role</th><th>Total Earned</th></tr></thead>
                                    <tbody>
                                        {partnerBalances.map((pb) => (
                                            <tr key={pb.address}>
                                                <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                                                    {pb.address.slice(0, 10)}...{pb.address.slice(-8)}
                                                </td>
                                                <td><span className="badge" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)" }}>{pb.label}</span></td>
                                                <td style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--green)" }}>
                                                    ${(pb.amount / 1e6).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* Stats */}
                <div className="stats-grid">
                    {[
                        { value: stats.totalOrders, label: "Total Orders", color: "var(--text-primary)" },
                        { value: stats.settledOrders, label: "Settled", color: "var(--green)" },
                        { value: stats.pendingOrders, label: "Pending", color: "var(--yellow)" },
                        { value: `${successRate}%`, label: "Success Rate", color: "var(--accent-light)" },
                    ].map((s) => (
                        <div key={s.label} className="card stat-card count-up">
                            <div className="stat-value" style={{ background: "none", WebkitTextFillColor: s.color, color: s.color }}>
                                {loading ? "—" : s.value}
                            </div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Sponsor */}
                {data?.sponsor && (
                    <div className="card" style={{ marginBottom: 20 }}>
                        <h3 style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 6 }}>Sponsor Wallet (Fee Payer)</h3>
                        <a href={data.sponsor.explorerUrl} target="_blank" rel="noopener" className="explorer-link">
                            {data.sponsor.address.slice(0, 10)}...{data.sponsor.address.slice(-8)}
                        </a>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 6 }}>
                            Sponsors all gas fees for user transactions
                        </div>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className="card" style={{ marginBottom: 20, borderColor: result.success ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)" }}>
                        {result.success ? (
                            <>
                                <span className="badge badge-success">Settlement Complete</span>
                                <div style={{ marginTop: 8 }}>
                                    <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>Tx: </span>
                                    <a href={result.explorerUrl} target="_blank" rel="noopener" className="explorer-link">
                                        {result.txHash?.slice(0, 16)}...{result.txHash?.slice(-8)}
                                    </a>
                                </div>
                                {result.splits && (
                                    <div style={{ marginTop: 10 }}>
                                        <div className="split-bar" style={{ marginBottom: 8 }}>
                                            {result.splits.map((s, i) => <div key={i} className="split-segment" style={{ width: `${s.percent}%` }} />)}
                                        </div>
                                        {result.splits.map((s, i) => (
                                            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", padding: "3px 0", color: "var(--text-secondary)" }}>
                                                <span>{s.label} ({s.percent}%)</span>
                                                <span style={{ fontFamily: "monospace", color: "var(--text-primary)" }}>${(Number(s.amount) / 1e6).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div>
                                <span className="badge badge-error">Failed</span>
                                <p style={{ marginTop: 6, color: "var(--red)", fontSize: "0.85rem" }}>{result.error}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Agents */}
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 12 }}>
                    <span className="gradient-text">Agents</span> <span style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: "0.8rem" }}>9/9 active</span>
                </h2>
                <div className="agent-grid" style={{ marginBottom: 28 }}>
                    {[
                        { name: "SmartSplit", status: "active", desc: "Atomic multi-party splits" },
                        { name: "Reconciliation", status: "active", desc: "Memo-based settlement matching" },
                        { name: "Revenue Forecaster", status: "active", desc: "7-day revenue predictions" },
                        { name: "Smart Pricing", status: "active", desc: "Dynamic price optimization" },
                        { name: "Cash Optimizer", status: "active", desc: "DEX-based reserve management" },
                        { name: "Fraud Sentinel", status: "active", desc: "Pre-settlement risk checks" },
                        { name: "Business Insights", status: "active", desc: "Health scoring & growth analysis" },
                        { name: "Sub Guardian", status: "active", desc: "Failed payment recovery" },
                        { name: "Payout Orch", status: "active", desc: "CSV bulk payouts" },
                    ].map((agent) => (
                        <div key={agent.name} className="card" style={{ padding: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                                <span className={`agent-indicator ${agent.status}`} />
                                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{agent.name}</span>
                            </div>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{agent.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Orders */}
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 12 }}>Orders</h2>
                {orders.length > 0 ? (
                    <div className="table-container" style={{ marginBottom: 28 }}>
                        <table>
                            <thead><tr><th>Product</th><th>Amount</th><th>Status</th><th>Latency</th><th>Gas</th><th>Action</th></tr></thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id}>
                                        <td>{order.product?.name || "—"}</td>
                                        <td style={{ fontFamily: "monospace" }}>${Number(order.amount).toFixed(2)}</td>
                                        <td><span className={`badge badge-${order.status === "settled" ? "success" : order.status === "failed" ? "error" : "pending"}`}>{order.status}</span></td>
                                        <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-secondary)" }}>{getLatency(order)}</td>
                                        <td><span className="badge" style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd", fontSize: "0.7rem", border: "1px solid rgba(139,92,246,0.2)" }}>Sponsored</span></td>
                                        <td>
                                            <div style={{ display: "flex", gap: 4 }}>
                                                {order.status === "pending" ? (
                                                    <>
                                                        <button className="btn-primary" style={{ padding: "3px 10px", fontSize: "0.72rem" }} onClick={() => executeOrder(order.id)} disabled={executing !== null}>
                                                            {executing === order.id ? "..." : "Execute"}
                                                        </button>
                                                        <button
                                                            className="btn-secondary"
                                                            style={{ padding: "3px 10px", fontSize: "0.72rem" }}
                                                            onClick={() => setQrOrder(order)}
                                                        >
                                                            QR
                                                        </button>
                                                    </>
                                                ) : (
                                                    <Link href={`/checkout/${order.id}`} className="btn-ghost" style={{ padding: "3px 10px", fontSize: "0.72rem" }}>View</Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", marginBottom: 28 }}>
                        <p style={{ marginBottom: 16 }}>No active orders to display.</p>
                        <button className="btn-primary" onClick={handleSimulatePurchase} disabled={executing !== null}>
                            {executing ? "Processing..." : "Simulate Purchase"}
                        </button>
                    </div>
                )}

                {/* Transactions */}
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 12 }}>Recent Transactions</h2>
                {data?.recentTransactions && data.recentTransactions.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead><tr><th>To</th><th>Amount</th><th>Memo</th><th>Hash</th><th>Status</th></tr></thead>
                            <tbody>
                                {data.recentTransactions.map((tx) => (
                                    <tr key={tx.id}>
                                        <td style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{tx.to.slice(0, 8)}...{tx.to.slice(-6)}</td>
                                        <td style={{ fontFamily: "monospace" }}>${(Number(tx.amount) / 1e6).toFixed(2)}</td>
                                        <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{tx.memo || "—"}</td>
                                        <td>{tx.txHash ? <a href={tx.explorerUrl} target="_blank" rel="noopener" className="explorer-link">{tx.txHash.slice(0, 10)}...</a> : "—"}</td>
                                        <td><span className={`badge badge-${tx.status === "confirmed" ? "success" : tx.status === "failed" ? "error" : "pending"}`}>{tx.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                        <p>No transactions yet.</p>
                        <Link href="/api/seed" className="btn-secondary" style={{ marginTop: 12, display: "inline-block" }}>Seed Demo Data</Link>
                    </div>
                )}

                {/* Quick Actions */}
                <div style={{ marginTop: 28, textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                        <button className="btn-primary" onClick={handleSimulatePurchase} disabled={executing !== null} style={{ minWidth: 180 }}>
                            {executing ? (
                                <span style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                                    <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />Processing...
                                </span>
                            ) : "Simulate Purchase"}
                        </button>
                        <Link href="/ai" className="btn-secondary" style={{ minWidth: 180 }}>AI Command Center</Link>
                        <Link href="/dashboard/schedule" className="btn-secondary" style={{ minWidth: 140 }}>Schedules</Link>
                        <Link href="/dashboard/audit" className="btn-ghost" style={{ minWidth: 140 }}>Audit Trail</Link>
                    </div>
                </div>
            </div>

            {/* QR Modal */}
            <QRModal
                isOpen={!!qrOrder}
                onClose={() => setQrOrder(null)}
                checkoutUrl={qrOrder ? `${typeof window !== 'undefined' ? window.location.origin : ''}/checkout/${qrOrder.id}` : ''}
                amount={qrOrder ? Number(qrOrder.amount).toFixed(2) : undefined}
                productName={qrOrder?.product?.name}
            />
        </div >
    );
}
