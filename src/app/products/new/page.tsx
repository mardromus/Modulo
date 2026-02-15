"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface SplitRule {
    address: string;
    percent: number;
    label: string;
}

export default function NewProductPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [rules, setRules] = useState<SplitRule[]>([
        { address: "", percent: 85, label: "Merchant" },
        { address: "", percent: 10, label: "Platform Fee" },
        { address: "", percent: 5, label: "Creator Royalty" },
    ]);
    const [merchantId, setMerchantId] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; productId?: string; error?: string } | null>(null);

    const totalPercent = rules.reduce((s, r) => s + r.percent, 0);

    const { user } = useAuth();

    // Fetch existing merchant or default
    // Fetch existing merchant or default
    useEffect(() => {
        if (!user?.id) return;
        fetch(`/api/merchants?privyId=${user.id}`)
            .then(async (r) => {
                const data = await r.json();
                if (data.merchants && data.merchants.length > 0) {
                    setMerchantId(data.merchants[0].id);
                } else {
                    // Auto-create merchant if none exists
                    try {
                        const createRes = await fetch("/api/merchants", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: "My Store", ownerUserId: user.id }),
                        });
                        const createData = await createRes.json();
                        if (createData.merchant) {
                            setMerchantId(createData.merchant.id);
                        }
                    } catch (e) {
                        console.error("Failed to auto-create merchant", e);
                    }
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [user?.id]);

    function addRule() { setRules([...rules, { address: "", percent: 0, label: "" }]); }
    function removeRule(idx: number) { setRules(rules.filter((_, i) => i !== idx)); }
    function updateRule(idx: number, field: keyof SplitRule, value: string | number) {
        const updated = [...rules];
        updated[idx] = { ...updated[idx], [field]: value };
        setRules(updated);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (totalPercent !== 100) return;
        setSubmitting(true);
        setResult(null);
        try {
            const res = await fetch(`/api/merchants/${merchantId}/products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, priceAmount: price, splitRules: rules }),
            });
            const data = await res.json();
            if (data.success) { setResult({ success: true, productId: data.product.id }); }
            else { setResult({ success: false, error: data.error || "Failed" }); }
        } catch (e) { setResult({ success: false, error: String(e) }); }
        setSubmitting(false);
    }

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 640, paddingTop: 40, paddingBottom: 64 }}>
                <div style={{ marginBottom: 32 }}>
                    <Link href="/dashboard" className="btn-ghost" style={{ fontSize: "0.8rem", marginBottom: 12, display: "inline-block" }}>← Back to Dashboard</Link>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>
                        <span className="gradient-text">Create Product</span>
                    </h1>
                    <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>
                        Define pricing and automated split rules
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Product Details */}
                    <div className="card" style={{ marginBottom: 24, padding: 24 }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 4, height: 16, background: "var(--accent)", borderRadius: 2 }} />
                            Product Details
                        </h3>

                        <div className="form-group">
                            <label className="form-label">Merchant ID</label>
                            <input
                                className="input"
                                value={merchantId}
                                onChange={(e) => setMerchantId(e.target.value)}
                                placeholder={loading ? "Loading..." : "Enter Merchant ID or refresh to auto-create"}
                                disabled={loading}
                                style={{ fontFamily: "monospace", color: "var(--text-secondary)" }}
                            />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">Product Name</label>
                                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Premium Subscription" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Price</label>
                                <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: 12, top: 10, color: "var(--text-muted)" }}>$</span>
                                    <input
                                        className="input"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0.00"
                                        type="number"
                                        step="0.01"
                                        required
                                        style={{ paddingLeft: 24 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Split Rules */}
                    <div className="card" style={{ marginBottom: 24, padding: 24 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h3 style={{ fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ width: 4, height: 16, background: "var(--green)", borderRadius: 2 }} />
                                Smart Splits
                            </h3>
                            <div style={{
                                padding: "4px 12px",
                                borderRadius: 20,
                                background: totalPercent === 100 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                                color: totalPercent === 100 ? "var(--green)" : "var(--red)",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                border: `1px solid ${totalPercent === 100 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`
                            }}>
                                {totalPercent}% Assigned
                            </div>
                        </div>

                        <div className="split-bar" style={{ marginBottom: 24, height: 12, borderRadius: 6, overflow: "hidden", display: "flex" }}>
                            {rules.map((r, i) => (
                                <div
                                    key={i}
                                    style={{
                                        width: `${r.percent}%`,
                                        background: i % 3 === 0 ? "var(--accent)" : i % 3 === 1 ? "var(--green)" : "var(--yellow)",
                                        height: "100%",
                                        transition: "width 0.3s ease"
                                    }}
                                    title={`${r.label}: ${r.percent}%`}
                                />
                            ))}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {rules.map((rule, idx) => (
                                <div key={idx} className="card" style={{ padding: 12, border: "1px solid var(--card-border)", background: "rgba(255,255,255,0.02)" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8, marginBottom: 8 }}>
                                        <input
                                            className="input"
                                            value={rule.label}
                                            onChange={(e) => updateRule(idx, "label", e.target.value)}
                                            placeholder="Label (e.g. Platform)"
                                            style={{ fontSize: "0.85rem" }}
                                        />
                                        <input
                                            className="input"
                                            value={rule.address}
                                            onChange={(e) => updateRule(idx, "address", e.target.value)}
                                            placeholder="Wallet Address (or User ID)"
                                            style={{ fontSize: "0.85rem", fontFamily: "monospace" }}
                                        />
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <input
                                                className="input"
                                                type="number"
                                                value={rule.percent}
                                                onChange={(e) => updateRule(idx, "percent", Number(e.target.value))}
                                                min={0}
                                                max={100}
                                                style={{ width: 70, textAlign: "center" }}
                                            />
                                            <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>%</span>
                                        </div>
                                        {rules.length > 1 && (
                                            <button type="button" className="btn-ghost" onClick={() => removeRule(idx)} style={{ color: "var(--red)", fontSize: "0.8rem" }}>
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button type="button" className="btn-secondary" onClick={addRule} style={{ marginTop: 16, width: "100%", borderStyle: "dashed" }}>
                            + Add Recipient
                        </button>
                    </div>

                    <div style={{ position: "sticky", bottom: 20, zIndex: 10 }}>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={submitting || totalPercent !== 100 || !name || !price || !merchantId}
                            style={{
                                width: "100%",
                                padding: "16px",
                                fontSize: "1rem",
                                boxShadow: "0 4px 20px rgba(139,92,246,0.3)"
                            }}
                        >
                            {submitting ? "Creating On-Chain Config..." : "Create Product & Splits"}
                        </button>
                    </div>


                    {result && (
                        <div className="card" style={{ marginTop: 14, borderColor: result.success ? "#22c55e" : "#ef4444" }}>
                            {result.success ? (
                                <div>
                                    <span className="badge badge-success">Product Created</span>
                                    <p style={{ marginTop: 6, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                        Product ID: <code style={{ color: "var(--text-primary)", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4 }}>{result.productId}</code>
                                    </p>
                                    <button onClick={() => router.push("/dashboard")} className="btn-primary" style={{ marginTop: 14, width: "100%" }}>
                                        Go to Dashboard →
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <span className="badge badge-error">Failed</span>
                                    <p style={{ marginTop: 6, color: "#ef4444", fontSize: "0.82rem" }}>{result.error}</p>
                                </div>
                            )}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
