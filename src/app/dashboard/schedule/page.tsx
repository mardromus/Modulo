"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface Schedule {
    id: string;
    productId: string;
    amount: string;
    currency: string;
    interval: string;
    status: string;
    customerWallet: string;
    merchantWallet: string;
    nextPaymentAt: string;
    retryCount: number;
    maxRetries: number;
    createdAt: string;
}

interface Product {
    id: string;
    name: string;
    priceAmount: string;
}

export default function SchedulePage() {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [merchantId, setMerchantId] = useState("");
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [selectedProduct, setSelectedProduct] = useState("");
    const [interval, setInterval] = useState("monthly");
    const [customerWallet, setCustomerWallet] = useState("");

    useEffect(() => {
        if (!user?.id) return;
        loadData();
    }, [user?.id]);

    async function loadData() {
        setLoading(true);
        try {
            const merchantRes = await fetch(`/api/merchants?privyId=${user!.id}`);
            const merchantData = await merchantRes.json();

            if (merchantData.merchants?.[0]) {
                const mid = merchantData.merchants[0].id;
                setMerchantId(mid);

                const [scheduleRes, productsRes] = await Promise.all([
                    fetch(`/api/merchants/${mid}/schedules`),
                    fetch(`/api/merchants/${mid}/products`),
                ]);

                if (scheduleRes.ok) {
                    const sData = await scheduleRes.json();
                    setSchedules(sData.schedules || []);
                }
                if (productsRes.ok) {
                    const pData = await productsRes.json();
                    setProducts(pData.products || []);
                }
            }
        } catch (e) {
            console.error("Failed to load schedules", e);
        }
        setLoading(false);
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedProduct || !customerWallet) return;

        const product = products.find((p) => p.id === selectedProduct);
        if (!product) return;

        setCreating(true);
        try {
            const res = await fetch(`/api/merchants/${merchantId}/schedules`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: selectedProduct,
                    customerWallet,
                    merchantWallet: "0x031891A61200FedDd622EbACC10734BC90093B2A",
                    amount: product.priceAmount,
                    interval,
                }),
            });

            if (res.ok) {
                setShowForm(false);
                setSelectedProduct("");
                setCustomerWallet("");
                loadData();
            }
        } catch (e) {
            console.error("Failed to create schedule", e);
        }
        setCreating(false);
    }

    function getStatusColor(status: string) {
        switch (status) {
            case "active": return "var(--green)";
            case "paused": return "var(--yellow)";
            case "cancelled": return "var(--red)";
            case "past_due": return "var(--orange, #f97316)";
            default: return "var(--text-secondary)";
        }
    }

    function getIntervalLabel(interval: string) {
        switch (interval) {
            case "weekly": return "Every week";
            case "monthly": return "Every month";
            case "yearly": return "Every year";
            default: return interval;
        }
    }

    function getTimeUntil(dateStr: string) {
        const now = new Date();
        const target = new Date(dateStr);
        const diff = target.getTime() - now.getTime();
        if (diff < 0) return "Overdue";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `in ${days}d ${hours}h`;
        return `in ${hours}h`;
    }

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                    <div>
                        <Link href="/dashboard" className="btn-ghost" style={{ fontSize: "0.8rem", marginBottom: 8, display: "inline-block" }}>
                            ← Back to Dashboard
                        </Link>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                            <span className="gradient-text">Scheduled Payments</span>
                        </h1>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 2 }}>
                            Recurring billing and automated collection
                        </p>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={() => setShowForm(!showForm)}
                        style={{ fontSize: "0.8rem" }}
                    >
                        {showForm ? "Cancel" : "+ New Schedule"}
                    </button>
                </div>

                {/* Create Form */}
                {showForm && (
                    <div className="card" style={{ marginBottom: 24 }}>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 16 }}>
                            Create Recurring Payment
                        </h3>
                        <form onSubmit={handleCreate}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: 6 }}>Product</label>
                                    <select
                                        className="input"
                                        value={selectedProduct}
                                        onChange={(e) => setSelectedProduct(e.target.value)}
                                        required
                                    >
                                        <option value="">Select a product...</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} (${Number(p.priceAmount).toFixed(2)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: 6 }}>Frequency</label>
                                    <select
                                        className="input"
                                        value={interval}
                                        onChange={(e) => setInterval(e.target.value)}
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: 6 }}>Customer Wallet Address</label>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="0x..."
                                    value={customerWallet}
                                    onChange={(e) => setCustomerWallet(e.target.value)}
                                    required
                                />
                            </div>
                            <button className="btn-primary" type="submit" disabled={creating} style={{ width: "100%", padding: 12 }}>
                                {creating ? "Creating..." : "Create Schedule"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Schedule Cards */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Loading schedules...</div>
                ) : schedules.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: 48 }}>
                        <div style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 8 }}>No scheduled payments</div>
                        <p style={{ color: "var(--text-secondary)", marginBottom: 20, fontSize: "0.85rem" }}>
                            Set up recurring billing to automate collections from your customers.
                        </p>
                        <button className="btn-primary" onClick={() => setShowForm(true)}>
                            + Create First Schedule
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: 16 }}>
                        {schedules.map((s) => (
                            <div key={s.id} className="card" style={{ padding: 20 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                            <span style={{
                                                width: 8, height: 8, borderRadius: "50%",
                                                background: getStatusColor(s.status),
                                                boxShadow: `0 0 8px ${getStatusColor(s.status)}`,
                                                display: "inline-block"
                                            }} />
                                            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                                                ${Number(s.amount).toFixed(2)} / {s.interval}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                                            {s.customerWallet.slice(0, 10)}...{s.customerWallet.slice(-6)}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <span className={`badge badge-${s.status === "active" ? "success" : s.status === "paused" ? "pending" : "error"}`}>
                                            {s.status}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "12px 0", borderTop: "1px solid var(--border)" }}>
                                    <div>
                                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 2 }}>Frequency</div>
                                        <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{getIntervalLabel(s.interval)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 2 }}>Next Payment</div>
                                        <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{new Date(s.nextPaymentAt).toLocaleDateString()}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 2 }}>Countdown</div>
                                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent)" }}>{getTimeUntil(s.nextPaymentAt)}</div>
                                    </div>
                                </div>

                                {s.retryCount > 0 && (
                                    <div style={{ marginTop: 8, fontSize: "0.78rem", color: "var(--yellow)" }}>
                                        Retries: {s.retryCount}/{s.maxRetries}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
