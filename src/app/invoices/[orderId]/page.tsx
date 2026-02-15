"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface InvoiceData {
    order: {
        id: string;
        createdAt: string;
        amount: string;
        currency: string;
        status: string;
        product: {
            name: string;
            priceAmount: string;
            splitJson?: string;
        };
        merchant: {
            name: string;
            owner: {
                email: string | null;
            };
        };
        nettingRuns: Array<{
            id: string;
            status: string;
            transactions: Array<{
                toAddress: string;
                amount: string;
                txHash: string | null;
                status: string;
            }>;
        }>;
    };
}

export default function InvoicePage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const [data, setData] = useState<InvoiceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/orders/${orderId}/invoice`)
            .then(res => {
                if (!res.ok) throw new Error("Order not found");
                return res.json();
            })
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [orderId]);

    if (loading) return <div className="page-center"><div className="spinner" /></div>;
    if (error || !data) return (
        <div className="page-center" style={{ flexDirection: "column", gap: 12 }}>
            <p className="text-secondary">{error || "Invoice not found"}</p>
            {/* Debug info */}
            <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--red)", maxWidth: 600, wordBreak: "break-all" }}>
                Order ID: {orderId}
            </div>
        </div>
    );

    const { order } = data;
    const date = new Date(order.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
    const time = new Date(order.createdAt).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });

    // Parse splits for invoice line items if available
    let lineItems = [];
    try {
        if (order.product.splitJson) {
            const splits = JSON.parse(order.product.splitJson);
            lineItems = splits.map((s: any) => ({
                description: `Split: ${s.label} (${s.percent}%)`,
                amount: (Number(order.amount) * s.percent / 100).toFixed(2)
            }));
        } else {
            lineItems = [{ description: order.product.name, amount: Number(order.amount).toFixed(2) }];
        }
    } catch (e) {
        lineItems = [{ description: order.product.name, amount: Number(order.amount).toFixed(2) }];
    }

    return (
        <div className="page" style={{ background: "white", minHeight: "100vh", color: "black" }}>
            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    .page { background: white !important; color: black !important; }
                    body { background: white !important; }
                }
            `}</style>

            <div className="container" style={{ maxWidth: 800, padding: 40, background: "white" }}>
                {/* Header Actions */}
                <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 40 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <Link href="/dashboard/transactions" className="btn-ghost" style={{ color: "#666" }}>← Back to Transactions</Link>
                        <p style={{ fontSize: "0.75rem", color: "#999", margin: 0 }}>Powered by Modulo Infrastructure</p>
                    </div>
                    <button onClick={() => window.print()} className="btn-primary" style={{ background: "black", color: "white", borderColor: "black" }}>
                        Print Invoice
                    </button>
                </div>

                {/* Invoice Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 60 }}>
                    <div>
                        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>INVOICE</h1>
                        <div style={{ marginTop: 8, color: "#666", fontSize: "0.9rem" }}>#{order.id.slice(0, 8).toUpperCase()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, fontSize: "1.2rem" }}>{order.merchant.name}</div>
                        <div style={{ color: "#666", fontSize: "0.9rem", marginTop: 4 }}>Modulo Merchant</div>
                        <div style={{ color: "#666", fontSize: "0.9rem" }}>{order.merchant.owner.email}</div>
                    </div>
                </div>

                {/* Details Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginBottom: 60 }}>
                    <div>
                        <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666", marginBottom: 8 }}>Billed To</div>
                        <div style={{ fontWeight: 500 }}>Guest Customer</div>
                        <div style={{ color: "#666", fontSize: "0.9rem" }}>Paid via Modulo Checkout</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        <div>
                            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666", marginBottom: 8 }}>Date Issued</div>
                            <div style={{ fontWeight: 500 }}>{date}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666", marginBottom: 8 }}>Amount Due</div>
                            <div style={{ fontWeight: 500 }}>$0.00</div>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div style={{ marginBottom: 40 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", borderBottom: "2px solid black", paddingBottom: 12, marginBottom: 12 }}>
                        <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>Description</div>
                        <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, textAlign: "right" }}>Amount</div>
                    </div>
                    {lineItems.map((item: { description: string, amount: string }, i: number) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr", padding: "12px 0", borderBottom: "1px solid #eee" }}>
                            <div>{item.description}</div>
                            <div style={{ textAlign: "right", fontFamily: "monospace" }}>${item.amount}</div>
                        </div>
                    ))}
                    <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", padding: "20px 0", alignItems: "center" }}>
                        <div style={{ textAlign: "right", fontWeight: 700, paddingRight: 20 }}>Total Paid</div>
                        <div style={{ textAlign: "right", fontWeight: 700, fontSize: "1.2rem", fontFamily: "monospace" }}>${Number(order.amount).toFixed(2)}</div>
                    </div>
                </div>

                {/* Footer / Status */}
                <div style={{ marginTop: 60, paddingTop: 20, borderTop: "1px solid #eee", color: "#666", fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>
                    <div>
                        Status: <span style={{ textTransform: "uppercase", color: order.status === "settled" ? "green" : "orange", fontWeight: 600 }}>{order.status}</span>
                    </div>
                    <div>
                        Transaction Date: {date} at {time}
                    </div>
                </div>
            </div>
        </div>
    );
}
