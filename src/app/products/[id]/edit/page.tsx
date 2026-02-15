"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface SplitRule {
    address: string;
    percent: number;
    label: string;
}

export default function EditProductPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [priceAmount, setPriceAmount] = useState("");
    const [splits, setSplits] = useState<SplitRule[]>([]);

    useEffect(() => {
        fetch(`/api/products/${productId}`)
            .then(r => {
                if (!r.ok) throw new Error("Failed to fetch product");
                return r.json();
            })
            .then(data => {
                const p = data.product;
                setName(p.name);
                setPriceAmount(p.priceAmount);
                setSplits(p.splitRules || []);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [productId]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            const res = await fetch(`/api/products/${productId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    priceAmount,
                    splitRules: splits
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update product");
            }

            router.push("/dashboard/products");
        } catch (err: any) {
            setError(err.message);
            setSaving(false);
        }
    };

    const updateSplit = (index: number, field: keyof SplitRule, value: any) => {
        const newSplits = [...splits];
        newSplits[index] = { ...newSplits[index], [field]: value };
        setSplits(newSplits);
    };

    const totalPercent = splits.reduce((s, r) => s + Number(r.percent), 0);

    if (loading) return <div className="page-center"><div className="spinner" /></div>;

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 800 }}>
                <div style={{ marginBottom: 32 }}>
                    <Link href="/dashboard/products" className="btn-ghost" style={{ marginBottom: 12, display: "inline-block" }}>← Back to Products</Link>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>Edit Product</h1>
                </div>

                <div className="card">
                    {error && (
                        <div style={{ padding: 12, background: "rgba(255,0,0,0.1)", color: "var(--error)", borderRadius: 8, marginBottom: 20 }}>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Product Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Price ($)</label>
                        <input type="number" step="0.01" value={priceAmount} onChange={e => setPriceAmount(e.target.value)} />
                    </div>

                    <div style={{ marginTop: 32, marginBottom: 16 }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Smart Split Rules</h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Configure how revenue is distributed.</p>
                    </div>

                    <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: 8, padding: 16 }}>
                        {splits.map((split, i) => (
                            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                                <div>
                                    <label className="form-label">Wallet Address</label>
                                    <input type="text" value={split.address} onChange={e => updateSplit(i, "address", e.target.value)} style={{ fontSize: "0.8rem", fontFamily: "monospace" }} />
                                </div>
                                <div>
                                    <label className="form-label">Label</label>
                                    <input type="text" value={split.label} onChange={e => updateSplit(i, "label", e.target.value)} />
                                </div>
                                <div>
                                    <label className="form-label">Percent (%)</label>
                                    <input type="number" value={split.percent} onChange={e => updateSplit(i, "percent", Number(e.target.value))} />
                                </div>
                            </div>
                        ))}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: 12 }}>
                            <div style={{ fontSize: "0.9rem", fontWeight: 600, color: Math.abs(totalPercent - 100) > 0.1 ? "var(--error)" : "var(--success)" }}>
                                Total: {totalPercent}%
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
                        <button className="btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
