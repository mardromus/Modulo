"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface AuditEvent {
    id: string;
    type: string;
    timestamp: string;
    title: string;
    description: string;
    amount: string;
    status: string;
    hash: string | null;
}

export default function AuditPage() {
    const { user, ready } = useAuth();
    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;

        async function loadAudit() {
            setLoading(true);
            try {
                // Get merchant ID first
                const merchantRes = await fetch(`/api/merchants?privyId=${user!.id}`);
                const merchantData = await merchantRes.json();

                if (merchantData.merchants?.[0]) {
                    const merchantId = merchantData.merchants[0].id;
                    const auditRes = await fetch(`/api/merchants/${merchantId}/audit`);
                    const auditData = await auditRes.json();
                    if (auditData.events) {
                        setEvents(auditData.events);
                    }
                }
            } catch (e) {
                console.error("Failed to load audit logs", e);
            }
            setLoading(false);
        }

        loadAudit();
    }, [user?.id]);

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
                <div style={{ marginBottom: 32 }}>
                    <Link href="/dashboard" className="btn-ghost" style={{ fontSize: "0.8rem", marginBottom: 12, display: "inline-block" }}>← Back to Dashboard</Link>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>
                        <span className="gradient-text">Audit Trail</span>
                    </h1>
                    <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>
                        Immutable record of all contract interactions and settlements
                    </p>
                </div>

                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Event Type</th>
                                    <th>Description</th>
                                    <th>Value</th>
                                    <th>Status</th>
                                    <th>Proof</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} style={{ textAlign: "center", padding: 40 }}>Loading audit logs...</td></tr>
                                ) : events.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No events recorded yet.</td></tr>
                                ) : (
                                    events.map((e) => (
                                        <tr key={e.id}>
                                            <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                                {new Date(e.timestamp).toLocaleString()}
                                            </td>
                                            <td>
                                                <span className={`badge`} style={{
                                                    background: e.type === 'FUND_DISTRIBUTION' ? "rgba(34,197,94,0.1)" : "rgba(139,92,246,0.1)",
                                                    color: e.type === 'FUND_DISTRIBUTION' ? "var(--green)" : "var(--accent)",
                                                    fontSize: "0.75rem"
                                                }}>
                                                    {e.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 500, fontSize: "0.9rem" }}>
                                                <div>{e.title}</div>
                                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400 }}>{e.description}</div>
                                            </td>
                                            <td style={{ fontFamily: "monospace" }}>
                                                {e.amount ? `$${Number(e.amount).toFixed(2)}` : "—"}
                                            </td>
                                            <td>
                                                <span className={`badge badge-${e.status === 'confirmed' || e.status === 'settled' ? 'success' : e.status === 'pending' ? 'pending' : 'error'}`}>
                                                    {e.status}
                                                </span>
                                            </td>
                                            <td>
                                                {e.hash ? (
                                                    <a href={`https://explore.tempo.xyz/tx/${e.hash}`} target="_blank" rel="noopener" className="explorer-link">
                                                        {e.hash.slice(0, 8)}... ↗
                                                    </a>
                                                ) : "—"}
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
