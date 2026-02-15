"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PaymentQR } from "@/components/PaymentQR";
import { useAuth } from "@/hooks/useAuth";

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

export default function EmbedCheckoutPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const { login, isLoggedIn, ready } = useAuth(); // Use auth for wallet connection if needed

    const [order, setOrder] = useState<OrderStatus["order"] | null>(null);
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState(false);
    const [view, setView] = useState<"pay" | "qr">("pay");
    const [result, setResult] = useState<{
        success: boolean;
        txHash?: string;
        explorerUrl?: string;
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

    if (loading) return <div className="page-center"><div className="spinner" /></div>;

    if (!order) {
        return (
            <div style={{ padding: 20, textAlign: "center", color: "var(--text-secondary)" }}>
                <p>Order not found</p>
            </div>
        );
    }

    const checkoutUrl = typeof window !== 'undefined' ? `${window.location.origin}/checkout/${orderId}` : '';
    const isSettled = order.status === "settled" || result?.success;

    return (
        <div style={{
            background: "var(--card-bg)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            overflow: "hidden",
            maxWidth: 400,
            margin: "0 auto",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
        }}>
            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 2 }}>{order.merchant.name}</div>
                <div style={{ fontSize: "1rem", fontWeight: 700 }}>{order.product.name}</div>
            </div>

            {/* Content */}
            <div style={{ padding: 20 }}>
                {isSettled ? (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ width: 48, height: 48, background: "rgba(34,197,94,0.1)", color: "var(--green)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>Payment Complete</h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 20 }}>
                            Your transaction has been settled on the Tempo network.
                        </p>
                        <a href={result?.explorerUrl || order.runs[0]?.transactions[0]?.explorerUrl} target="_blank" rel="noopener" className="btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                            View Receipt ↗
                        </a>
                    </div>
                ) : (
                    <>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", marginBottom: 24 }}>
                            <span style={{ fontSize: "2rem", fontWeight: 800 }}>${Number(order.amount).toFixed(2)}</span>
                            <span style={{ color: "var(--text-secondary)", marginLeft: 6 }}>USD</span>
                        </div>
                        <div style={{ padding: 20, textAlign: "center", borderTop: "1px solid var(--border)", marginTop: 20 }}>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                Securely processed by <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Modulo</span>
                            </div>
                        </div>          {/* Toggle View */}
                        <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", padding: 4, borderRadius: 8, marginBottom: 20 }}>
                            <button
                                onClick={() => setView("pay")}
                                style={{
                                    flex: 1,
                                    padding: "8px",
                                    borderRadius: 6,
                                    fontSize: "0.85rem",
                                    fontWeight: 500,
                                    background: view === "pay" ? "var(--accent-glow)" : "transparent",
                                    color: view === "pay" ? "white" : "var(--text-secondary)",
                                    transition: "all 0.2s"
                                }}
                            >
                                Pay Now
                            </button>
                            <button
                                onClick={() => setView("qr")}
                                style={{
                                    flex: 1,
                                    padding: "8px",
                                    borderRadius: 6,
                                    fontSize: "0.85rem",
                                    fontWeight: 500,
                                    background: view === "qr" ? "var(--accent-glow)" : "transparent",
                                    color: view === "qr" ? "white" : "var(--text-secondary)",
                                    transition: "all 0.2s"
                                }}
                            >
                                Scan QR
                            </button>
                        </div>

                        {view === "pay" ? (
                            <div style={{ animation: "fadeIn 0.3s ease" }}>
                                {isLoggedIn ? (
                                    <>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, fontSize: "0.85rem", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                                            <span style={{ color: "var(--text-secondary)" }}>Wallet</span>
                                            <span style={{ fontFamily: "monospace" }}>{ready ? "Connected" : "Loading..."}</span>
                                        </div>
                                        <button
                                            className="btn-primary"
                                            onClick={handlePay}
                                            disabled={executing}
                                            style={{ width: "100%", padding: 16, fontSize: "1rem" }}
                                        >
                                            {executing ? (
                                                <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                                                    <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Processing
                                                </span>
                                            ) : "Confirm Payment"}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="btn-primary"
                                        onClick={login}
                                        style={{ width: "100%", padding: 16, fontSize: "1rem" }}
                                    >
                                        Log in to Pay
                                    </button>
                                )}
                                {result?.error && (
                                    <p style={{ marginTop: 12, color: "var(--red)", fontSize: "0.85rem", textAlign: "center" }}>
                                        {result.error}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div style={{ animation: "fadeIn 0.3s ease", display: "flex", justifyContent: "center" }}>
                                <PaymentQR
                                    checkoutUrl={checkoutUrl}
                                    amount={Number(order.amount).toFixed(2)}
                                    productName={order.product.name}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            <div style={{ padding: "12px", textAlign: "center", borderTop: "1px solid var(--border)", background: "rgba(0,0,0,0.2)" }}>
                <a href={typeof window !== 'undefined' ? window.location.origin : '#'} target="_blank" rel="noopener" style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
                    <span style={{ width: 8, height: 8, background: "var(--accent)", borderRadius: 2 }} />
                    Powered by <strong>AgentMesh</strong>
                </a>
            </div>
        </div>
    );
}
