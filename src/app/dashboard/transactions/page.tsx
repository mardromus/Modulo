"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface OrderData {
    id: string;
    status: string;
    amount: string;
    currency: string;
    createdAt: string;
    product: { name: string; splitJson?: string };
    latestRun: {
        id: string;
        transactions: Array<{
            id: string;
            txHash: string;
            explorerUrl: string;
        }>;
    } | null;
}

export default function TransactionsPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [merchantId, setMerchantId] = useState<string | null>(null);

    // Fetch merchant ID first
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

    // Fetch orders once merchant ID is known
    useEffect(() => {
        if (!merchantId) return;
        fetch(`/api/merchants/${merchantId}/orders`)
            .then(r => r.json())
            .then(data => {
                setOrders(data.orders || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [merchantId]);

    function exportCSV() {
        const headers = ["Order ID", "Date", "Product", "Amount", "Status", "TxHash"];
        const rows = orders.map(o => [
            o.id,
            new Date(o.createdAt).toLocaleString(),
            o.product?.name || "Unknown",
            o.amount,
            o.status,
            o.latestRun?.transactions[0]?.txHash || ""
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "transactions.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
                <div style={{ marginBottom: 32 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <Link href="/dashboard" className="btn-ghost" style={{ fontSize: "0.8rem", marginBottom: 8, display: "inline-block" }}>← Back to Dashboard</Link>
                            <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>Transactions</h1>
                            <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>
                                Full history of all orders and settlements
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button onClick={exportCSV} className="btn-secondary" disabled={orders.length === 0}>
                                Export CSV
                            </button>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Transaction</th>
                                    <th>Invoice</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>
                                            <div className="spinner" style={{ margin: "0 auto 12px" }} />
                                            Loading transactions...
                                        </td>
                                    </tr>
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>
                                            No transactions found.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order.id}>
                                            <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                                {new Date(order.createdAt).toLocaleDateString()} <br />
                                                <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>{new Date(order.createdAt).toLocaleTimeString()}</span>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{order.product?.name || "—"}</div>
                                                <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-muted)" }}>#{order.id.slice(0, 8)}</div>
                                            </td>
                                            <td style={{ fontFamily: "monospace", fontWeight: 600 }}>
                                                ${Number(order.amount).toFixed(2)}
                                            </td>
                                            <td>
                                                <span className={`badge badge-${order.status === "settled" ? "success" : order.status === "failed" ? "error" : "pending"}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>
                                                {order.latestRun?.transactions[0]?.txHash ? (
                                                    <a href={order.latestRun.transactions[0].explorerUrl} target="_blank" rel="noopener" className="explorer-link">
                                                        {order.latestRun.transactions[0].txHash.slice(0, 6)}...{order.latestRun.transactions[0].txHash.slice(-4)} ↗
                                                    </a>
                                                ) : (
                                                    <span style={{ color: "var(--text-muted)" }}>—</span>
                                                )}
                                            </td>
                                            <td>
                                                <Link href={`/invoices/${order.id}`} className="btn-ghost" style={{ fontSize: "0.75rem", padding: "4px 8px" }}>
                                                    View Invoice
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
