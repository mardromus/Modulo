"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function RunLogsPage() {
    const params = useParams();
    const runId = params.id as string;
    const [run, setRun] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);

    useEffect(() => {
        fetchRunDetails();
    }, [runId]);

    async function fetchRunDetails() {
        try {
            const res = await fetch(`/api/payouts/csv`);
            const data = await res.json();
            const found = data.runs?.find((r: any) => r.id === runId);
            setRun(found || null);
        } catch {
            setRun(null);
        } finally {
            setLoading(false);
        }
    }

    async function handleRetry() {
        setRetrying(true);
        try {
            const res = await fetch(`/api/netting/${runId}/retry`, { method: "POST" });
            const data = await res.json();
            if (data.success) {
                fetchRunDetails();
            }
        } catch {
            // ignore
        } finally {
            setRetrying(false);
        }
    }

    if (loading) {
        return (
            <div className="page">
                <div className="container" style={{ paddingTop: 32 }}>
                    <div style={{ textAlign: "center", padding: "60px 0", color: "#a3a3a3" }}>Loading run details...</div>
                </div>
            </div>
        );
    }

    if (!run) {
        return (
            <div className="page">
                <div className="container" style={{ paddingTop: 32 }}>
                    <div style={{ textAlign: "center", padding: "60px 0" }}>
                        <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Run Not Found</h2>
                        <p style={{ color: "#a3a3a3" }}>No netting run found with ID: {runId}</p>
                        <Link href="/dashboard" className="btn-primary" style={{ marginTop: 16, display: "inline-block" }}>
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const statusColor = run.status === "completed" ? "#22c55e" : run.status === "failed" ? "#ef4444" : "#eab308";

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                    <div>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Run Details</h1>
                        <p style={{ color: "#a3a3a3", fontSize: "0.78rem", fontFamily: "monospace", marginTop: 2 }}>
                            {runId}
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <span className={`badge ${run.status === "completed" ? "badge-success" : run.status === "failed" ? "badge-failed" : "badge-pending"}`}>
                            {run.status}
                        </span>
                        {run.status === "failed" && (
                            <button
                                className="btn-primary"
                                onClick={handleRetry}
                                disabled={retrying}
                                style={{ fontSize: "0.78rem" }}
                            >
                                {retrying ? "Retrying..." : "Retry Failed"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Summary Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                    <div className="card" style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: 1, color: "#a3a3a3", marginBottom: 6 }}>
                            Transactions
                        </div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>{run.transactionCount}</div>
                    </div>
                    <div className="card" style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: 1, color: "#a3a3a3", marginBottom: 6 }}>
                            Completed
                        </div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#22c55e" }}>{run.completedCount}</div>
                    </div>
                    <div className="card" style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: 1, color: "#a3a3a3", marginBottom: 6 }}>
                            Failed
                        </div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: run.failedCount > 0 ? "#ef4444" : "#737373" }}>
                            {run.failedCount}
                        </div>
                    </div>
                    <div className="card" style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: 1, color: "#a3a3a3", marginBottom: 6 }}>
                            Created
                        </div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                            {new Date(run.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                {/* Status Timeline */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 14 }}>Timeline</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {[
                            { label: "Run Created", time: run.createdAt, done: true },
                            { label: "Execution Started", time: run.createdAt, done: run.status !== "pending" },
                            { label: run.status === "completed" ? "Completed" : run.status === "failed" ? "Failed" : "In Progress", time: run.createdAt, done: run.status === "completed" || run.status === "failed" },
                        ].map((step, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: step.done ? (run.status === "failed" && i === 2 ? "#ef4444" : "#22c55e") : "#e5e5e5",
                                    flexShrink: 0,
                                }} />
                                <div>
                                    <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{step.label}</div>
                                    <div style={{ fontSize: "0.72rem", color: "#a3a3a3" }}>
                                        {new Date(step.time).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order Info */}
                {run.orderId && (
                    <div className="card">
                        <h3 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 10 }}>Associated Order</h3>
                        <div style={{ fontSize: "0.78rem", color: "#737373" }}>
                            Order ID: <code style={{ color: "#111" }}>{run.orderId}</code>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
