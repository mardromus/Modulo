"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface Product {
    id: string;
    name: string;
    priceAmount: string;
    currency: string;
    createdAt: string;
    splitJson: string;
}

export default function ProductsPage() {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [merchantId, setMerchantId] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) return;
        fetch(`/api/merchants?privyId=${user.id}`)
            .then(r => r.json())
            .then(data => {
                if (data.merchants && data.merchants.length > 0) {
                    setMerchantId(data.merchants[0].id);
                } else {
                    setLoading(false);
                }
            })
            .catch(() => setLoading(false));
    }, [user?.id]);

    useEffect(() => {
        if (!merchantId) return;
        // Re-using the orders endpoint or creating a new one? 
        // We don't have a direct "list products" endpoint in the plan, but we can assume /api/merchants/[id]/products exists or create it.
        // Actually, looking at previous logs, we implemented POST /api/merchants/[id]/products but maybe not GET.
        // I will implement GET /api/merchants/[id]/products first.
        fetch(`/api/merchants/${merchantId}/products`)
            .then(r => r.json())
            .then(data => {
                setProducts(data.products || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [merchantId]);

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
                <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>Products</h1>
                        <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>
                            Manage your product catalog and split rules
                        </p>
                    </div>
                    <div>
                        <Link href="/products/new" className="btn-primary" style={{ textDecoration: "none" }}>
                            + New Product
                        </Link>
                    </div>
                </div>

                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Price</th>
                                    <th>Smart Split</th>
                                    <th>Created</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} style={{ textAlign: "center", padding: 40 }}>Loading...</td></tr>
                                ) : products.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: "center", padding: 40 }}>No products found.</td></tr>
                                ) : (
                                    products.map(p => {
                                        let splits = [];
                                        try { splits = JSON.parse(p.splitJson); } catch (e) { }
                                        return (
                                            <tr key={p.id}>
                                                <td style={{ fontWeight: 600 }}>{p.name}</td>
                                                <td>${p.priceAmount}</td>
                                                <td>
                                                    <div style={{ display: "flex", gap: 4 }}>
                                                        {splits.map((s: any, i: number) => (
                                                            <span key={i} className="badge" style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)" }}>
                                                                {s.label}: {s.percent}%
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                                    {new Date(p.createdAt).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <Link href={`/products/${p.id}/edit`} className="btn-ghost">Edit</Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
