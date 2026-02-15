"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PaymentQR } from "@/components/PaymentQR";

interface OrderStatus {
    order: {
        id: string;
        status: string;
        amount: string;
        currency: string;
        createdAt: string;
        product: { name: string; splitRules: Array<{ address: string; percent: number; label: string }> };
        merchant: { name: string };
        runs: Array<{
            id: string;
            status: string;
            transactions: Array<{
                id: string;
                to: string;
                amount: string;
                txHash: string;
                memo: string;
                status: string;
                explorerUrl: string;
            }>;
        }>;
    };
}

export default function CheckoutPage() {
    const params = useParams();
    const orderId = params.orderId as string;

    const [order, setOrder] = useState<OrderStatus["order"] | null>(null);
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        txHash?: string;
        explorerUrl?: string;
        splits?: Array<{ to: string; amount: string; label: string; percent: number }>;
        error?: string;
    } | null>(null);

    useEffect(() => { loadOrder(); }, [orderId]);

    async function loadOrder() {
        try {
            const res = await fetch(`/api/orders/${orderId}/status`);
            if (res.ok) { const data = await res.json(); setOrder(data.order); }
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    async function handlePay() {
        setExecuting(true);
        try {
            const res = await fetch("/api/checkout/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });
            const data = await res.json();
            setResult(data);
            loadOrder();
        } catch (e) { setResult({ success: false, error: String(e) }); }
        setExecuting(false);
    }

    if (loading) {
        return (
            <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="spinner" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="page">
                <div className="container" style={{ paddingTop: 64, textAlign: "center" }}>
                    <h2 style={{ fontSize: "1.1rem" }}>Order not found</h2>
                    <p style={{ color: "var(--text-secondary)", marginTop: 6, fontSize: "0.85rem" }}>The order <code>{orderId}</code> does not exist.</p>
                    <Link href="/dashboard" className="btn-primary" style={{ marginTop: 20, display: "inline-block" }}>Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    const checkoutUrl = typeof window !== 'undefined' ? `${window.location.origin}/checkout/${orderId}` : '';

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
                <div className="checkout-card">
                    {/* Order Summary */}
                    <div className="card" style={{ marginBottom: 16 }}>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 14 }}>
                            <span className="gradient-text">Checkout</span>
                        </h2>

                        <div className="checkout-summary">
                            <div>
                                <div style={{ fontWeight: 600 }}>{order.product.name}</div>
                                <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>by {order.merchant.name}</div>
                            </div>
                            <div className="checkout-total">${Number(order.amount).toFixed(2)}</div>
                        </div>

                        {/* Split Preview */}
                        <div style={{ marginTop: 14 }}>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 6 }}>Payment Split:</div>
                            <div className="split-bar" style={{ marginBottom: 10 }}>
                                {order.product.splitRules.map((r, i) => <div key={i} className="split-segment" style={{ width: `${r.percent}%` }} />)}
                            </div>
                            {order.product.splitRules.map((r, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", padding: "3px 0", color: "var(--text-secondary)" }}>
                                    <span>{r.label}</span>
                                    <span style={{ color: "var(--text-primary)" }}>{r.percent}% · ${(Number(order.amount) * r.percent / 100).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Status */}
                        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Status:</span>
                            <span className={`badge badge-${order.status === "settled" ? "success" : order.status === "failed" ? "error" : order.status === "processing" ? "warning" : "pending"}`}>
                                {order.status}
                            </span>
                        </div>
                    </div>

                    {/* QR Code Toggle */}
                    {order.status === "pending" && (
                        <div style={{ textAlign: "center", marginBottom: 16 }}>
                            <button
                                className="btn-ghost"
                                onClick={() => setShowQR(!showQR)}
                                style={{ fontSize: "0.82rem" }}
                            >
                                {showQR ? "Hide QR Code" : "Show Payment QR Code"}
                            </button>
                            {showQR && (
                                <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
                                    <PaymentQR
                                        checkoutUrl={checkoutUrl}
                                        amount={Number(order.amount).toFixed(2)}
                                        productName={order.product.name}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pay Button */}
                    {order.status === "pending" && !result && (
                        <button className="btn-primary" onClick={handlePay} disabled={executing} style={{ width: "100%", padding: 14, fontSize: "0.95rem" }}>
                            {executing ? (
                                <span style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                                    <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />Processing...
                                </span>
                            ) : `Pay $${Number(order.amount).toFixed(2)} with AlphaUSD`}
                        </button>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="card" style={{ borderColor: result.success ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)" }}>
                            {result.success ? (
                                <>
                                    <div style={{ textAlign: "center", marginBottom: 14 }}>
                                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                                            <span className="gradient-text">Settlement Complete</span>
                                        </h3>
                                    </div>
                                    <div style={{ marginBottom: 10 }}>
                                        <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Transaction Hash:</span>
                                        <div style={{ marginTop: 3 }}>
                                            <a href={result.explorerUrl} target="_blank" rel="noopener" className="explorer-link" style={{ wordBreak: "break-all" }}>{result.txHash}</a>
                                        </div>
                                    </div>
                                    {result.splits && (
                                        <div style={{ marginTop: 14 }}>
                                            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 6 }}>Confirmed Splits:</div>
                                            {result.splits.map((s, i) => (
                                                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: "0.82rem", borderBottom: `1px solid var(--border)`, color: "var(--text-secondary)" }}>
                                                    <span>{s.label} ({s.percent}%)</span>
                                                    <span style={{ fontFamily: "monospace", color: "var(--text-primary)" }}>${(Number(s.amount) / 1e6).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <a href={result.explorerUrl} target="_blank" rel="noopener" className="btn-secondary" style={{ display: "block", textAlign: "center", marginTop: 16 }}>
                                        View on Explorer ↗
                                    </a>
                                </>
                            ) : (
                                <div style={{ textAlign: "center" }}>
                                    <h3 style={{ fontSize: "1.1rem" }}>Payment Failed</h3>
                                    <p style={{ color: "var(--red)", fontSize: "0.85rem", marginTop: 6 }}>{result.error}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Transaction History */}
                    {order.runs.length > 0 && order.runs[0].transactions.length > 0 && (
                        <div className="card" style={{ marginTop: 16 }}>
                            <h3 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 10 }}>Transaction History</h3>
                            {order.runs[0].transactions.map((tx) => (
                                <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid var(--border)` }}>
                                    <div>
                                        <div style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>→ {tx.to.slice(0, 10)}...{tx.to.slice(-6)}</div>
                                        <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{tx.memo}</div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>${(Number(tx.amount) / 1e6).toFixed(2)}</div>
                                        <span className={`badge badge-${tx.status === "confirmed" ? "success" : "pending"}`} style={{ fontSize: "0.6rem", padding: "1px 6px" }}>{tx.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <Link href="/dashboard" className="btn-ghost" style={{ display: "block", textAlign: "center", marginTop: 14 }}>← Back to Dashboard</Link>
                </div>
            </div>
        </div>
    );
}
