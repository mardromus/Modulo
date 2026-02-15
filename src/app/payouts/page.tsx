"use client";

import { useState, useRef } from "react";

const SAMPLE_CSV = `address,amount,label
0x1234567890abcdef1234567890abcdef12345678,10.50,Alice
0xabcdef1234567890abcdef1234567890abcdef12,25.00,Bob
0x9876543210fedcba9876543210fedcba98765432,15.75,Charlie
0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef,50.00,Treasury`;

export default function PayoutsPage() {
    const [csvContent, setCsvContent] = useState("");
    const [preview, setPreview] = useState<{ address: string; amount: string; label?: string }[]>([]);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    function parsePreview(csv: string) {
        try {
            const lines = csv.trim().split("\n");
            if (lines.length < 2) return [];
            const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
            const addrIdx = header.findIndex((h) => h === "address" || h === "wallet");
            const amtIdx = header.findIndex((h) => h === "amount");
            const lblIdx = header.findIndex((h) => h === "label" || h === "name");
            if (addrIdx === -1 || amtIdx === -1) return [];
            return lines.slice(1).filter(Boolean).map((line) => {
                const cols = line.split(",").map((c) => c.trim());
                return { address: cols[addrIdx] || "", amount: cols[amtIdx] || "", label: lblIdx >= 0 ? cols[lblIdx] : undefined };
            });
        } catch { return []; }
    }

    function handleCSV(text: string) {
        setCsvContent(text);
        setPreview(parsePreview(text));
        setResult(null);
        setError("");
    }

    function handleFile(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => handleCSV(e.target?.result as string);
        reader.readAsText(file);
    }

    async function executePayout() {
        if (!csvContent) return;
        setLoading(true);
        setError("");
        setResult(null);
        try {
            const res = await fetch("/api/payouts/csv", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ csvContent }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Payout failed");
            setResult(data);
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    }

    const totalAmount = preview.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                    <div>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                            <span className="gradient-text">CSV Bulk Payouts</span>
                        </h1>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 2 }}>
                            Upload a CSV to pay multiple recipients in parallel via nonce lanes
                        </p>
                    </div>
                    <button
                        className="btn-secondary"
                        onClick={() => handleCSV(SAMPLE_CSV)}
                        style={{ fontSize: "0.8rem" }}
                    >
                        Load Sample CSV
                    </button>
                </div>

                {/* Upload Area */}
                <div
                    className="card"
                    style={{
                        border: dragOver ? "2px dashed var(--accent)" : "2px dashed var(--border-hover)",
                        textAlign: "center",
                        padding: "48px 20px",
                        cursor: "pointer",
                        marginBottom: 20,
                        transition: "all 0.25s",
                        background: dragOver ? "var(--accent-glow)" : "transparent",
                    }}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); }}
                >
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".csv"
                        style={{ display: "none" }}
                        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
                    />
                    <div style={{ fontSize: "2rem", marginBottom: 8, color: "var(--accent)", opacity: 0.6 }}>↑</div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Drop CSV here or click to upload</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 6 }}>
                        Format: address, amount, label (optional)
                    </div>
                </div>

                {/* Manual CSV Input */}
                <div className="card" style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 10 }}>Or paste CSV directly</h3>
                    <textarea
                        value={csvContent}
                        onChange={(e) => handleCSV(e.target.value)}
                        rows={6}
                        placeholder={"address,amount,label\n0x1234...abcd,10.50,Alice\n0x5678...efgh,25.00,Bob"}
                        style={{
                            width: "100%", fontFamily: "monospace", fontSize: "0.78rem", padding: 12,
                            border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", resize: "vertical",
                            background: "rgba(255,255,255,0.03)", color: "var(--text-primary)",
                        }}
                    />
                </div>

                {/* Preview */}
                {preview.length > 0 && (
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <h3 style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                                Preview ({preview.length} recipients)
                            </h3>
                            <div className="gradient-text" style={{ fontSize: "0.95rem", fontWeight: 800 }}>
                                Total: ${totalAmount.toFixed(2)}
                            </div>
                        </div>

                        <div style={{ maxHeight: 300, overflowY: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                        <th style={{ textAlign: "left", padding: "8px 4px", color: "var(--text-muted)", fontWeight: 600 }}>#</th>
                                        <th style={{ textAlign: "left", padding: "8px 4px", color: "var(--text-muted)", fontWeight: 600 }}>Address</th>
                                        <th style={{ textAlign: "right", padding: "8px 4px", color: "var(--text-muted)", fontWeight: 600 }}>Amount</th>
                                        <th style={{ textAlign: "left", padding: "8px 4px", color: "var(--text-muted)", fontWeight: 600 }}>Label</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.map((r, i) => (
                                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                            <td style={{ padding: "8px 4px", color: "var(--text-muted)" }}>{i + 1}</td>
                                            <td style={{ padding: "8px 4px", fontFamily: "monospace" }}>{r.address.slice(0, 6)}...{r.address.slice(-4)}</td>
                                            <td style={{ padding: "8px 4px", textAlign: "right", fontWeight: 600, color: "var(--green)" }}>${parseFloat(r.amount).toFixed(2)}</td>
                                            <td style={{ padding: "8px 4px", color: "var(--text-secondary)" }}>{r.label || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                            <button className="btn-primary" onClick={executePayout} disabled={loading} style={{ fontSize: "0.85rem" }}>
                                {loading ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Executing payouts...
                                    </span>
                                ) : `Execute Payout ($${totalAmount.toFixed(2)})`}
                            </button>
                            <button className="btn-secondary" onClick={() => { setCsvContent(""); setPreview([]); setResult(null); }} style={{ fontSize: "0.85rem" }}>
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="card" style={{ borderLeft: "3px solid var(--red)", marginBottom: 20 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--red)", marginBottom: 4 }}>Error</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{error}</div>
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
                            {[
                                { l: "Total", v: `$${result.totalAmount}`, c: "var(--text-primary)" },
                                { l: "Completed", v: result.completedCount, c: "var(--green)" },
                                { l: "Failed", v: result.failedCount, c: result.failedCount > 0 ? "var(--red)" : "var(--text-muted)" },
                                { l: "Nonce Lanes", v: result.nonceLanes, c: "var(--accent-light)" },
                            ].map((s) => (
                                <div key={s.l} className="card count-up" style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 6 }}>{s.l}</div>
                                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: s.c }}>{s.v}</div>
                                </div>
                            ))}
                        </div>

                        {/* Per-recipient results */}
                        <div className="card" style={{ marginBottom: 20 }}>
                            <h3 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 14 }}>Transaction Results</h3>
                            {result.results?.map((r: any, i: number) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < result.results.length - 1 ? "1px solid var(--border)" : "none" }}>
                                    <div>
                                        <div style={{ fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 600 }}>
                                            {r.recipient.slice(0, 8)}...{r.recipient.slice(-4)}
                                        </div>
                                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                            Lane {r.nonceLane} | ${r.amount}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span className={`badge ${r.status === "success" ? "badge-success" : "badge-failed"}`}>
                                            {r.status}
                                        </span>
                                        {r.explorerUrl && (
                                            <a href={r.explorerUrl} target="_blank" rel="noopener noreferrer" className="explorer-link">
                                                View TX
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* AI Narrative */}
                        {result.aiNarrative && result.aiNarrative !== "Payout completed — AI analysis not available." && (
                            <div className="card" style={{ borderLeft: "3px solid var(--accent)" }}>
                                <h3 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 10 }}>
                                    <span className="gradient-text">AI Operations Analysis</span>
                                </h3>
                                <p style={{ fontSize: "0.82rem", lineHeight: 1.7, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                                    {result.aiNarrative}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
