"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface Customer {
    wallet: string;
    email?: string;
    phone?: string;
    totalSpent: number;
    lastOrder: string;
    orderCount: number;
}

export default function CustomersPage() {
    const { user } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        // Mocking customer data for now since we don't have a dedicated API
        // In a real app, we'd aggregate this from orders or use a dedicated table
        fetch(`/api/merchants?privyId=${user.id}`)
            .then(r => r.json())
            .then(data => {
                const merchantId = data.merchants?.[0]?.id;
                if (merchantId) {
                    fetch(`/api/merchants/${merchantId}/orders`)
                        .then(r => r.json())
                        .then(orderData => {
                            const orders = orderData.orders || [];
                            const customerMap = new Map<string, Customer>();

                            orders.forEach((o: any) => {
                                // Identify customer by wallet or privy ID
                                const id = o.customerWallet || o.customerPrivyId || "Guest";
                                if (!customerMap.has(id)) {
                                    customerMap.set(id, {
                                        wallet: id,
                                        totalSpent: 0,
                                        lastOrder: o.createdAt,
                                        orderCount: 0
                                    });
                                }
                                const c = customerMap.get(id)!;
                                c.totalSpent += Number(o.amount);
                                c.orderCount++;
                                if (new Date(o.createdAt) > new Date(c.lastOrder)) {
                                    c.lastOrder = o.createdAt;
                                }
                            });
                            setCustomers(Array.from(customerMap.values()));
                            setLoading(false);
                        });
                } else {
                    setLoading(false);
                }
            })
            .catch(() => setLoading(false));
    }, [user?.id]);

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>Customers</h1>
                    <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>
                        People who have purchased from you
                    </p>
                </div>

                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Total Spent</th>
                                    <th>Orders</th>
                                    <th>Last Active</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} style={{ textAlign: "center", padding: 40 }}>Loading...</td></tr>
                                ) : customers.length === 0 ? (
                                    <tr><td colSpan={4} style={{ textAlign: "center", padding: 40 }}>No customers found.</td></tr>
                                ) : (
                                    customers.map((c, i) => (
                                        <tr key={i}>
                                            <td style={{ fontFamily: "monospace" }}>{c.wallet.slice(0, 12)}...</td>
                                            <td style={{ fontWeight: 600 }}>${c.totalSpent.toFixed(2)}</td>
                                            <td>{c.orderCount}</td>
                                            <td style={{ color: "var(--text-secondary)" }}>{new Date(c.lastOrder).toLocaleDateString()}</td>
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
