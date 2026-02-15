"use client";

import Link from "next/link";

const features = [
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M9 21H4v-5" /></svg>,
    title: "SmartSplit Checkout",
    desc: "Atomic multi-party payment splits in a single on-chain transaction."
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
    title: "9 AI Agents",
    desc: "Revenue forecasting, pricing, fraud detection, subscriptions, payouts — all autonomous."
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>,
    title: "Privy Wallets",
    desc: "Email or phone sign-up creates a wallet. No seed phrases, no extensions."
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
    title: "Gasless UX",
    desc: "Sponsor wallet covers all gas fees. Users never pay transaction costs."
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
    title: "Tempo Settlement",
    desc: "Instant finality with parallel nonces and built-in stablecoin rails."
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>,
    title: "AI Insights",
    desc: "LLM-powered analysis, health scoring, and pricing recommendations in real time."
  },
];

const steps = [
  { n: "1", title: "Customer Pays", desc: "Single checkout with AlphaUSD" },
  { n: "2", title: "SmartSplit", desc: "Agent computes split amounts" },
  { n: "3", title: "Atomic Batch", desc: "All transfers in one tx" },
  { n: "4", title: "Reconciled", desc: "Memo matching confirms settlement" },
];

export default function Home() {
  return (
    <div className="page" style={{ position: "relative" }}>
      {/* Animated background orbs */}
      <div className="hero-bg">
        <div className="orb" />
        <div className="orb" />
        <div className="orb" />
        <div className="orb" />
        <div className="orb" />
        <div className="orb" />
      </div>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "100px 24px 80px", position: "relative", zIndex: 1 }}>
        <div className="badge badge-accent" style={{ marginBottom: 20, fontSize: "0.7rem" }}>
          <span className="live-dot" /> LIVE ON TEMPO TESTNET
        </div>
        <h1 style={{ fontSize: "clamp(2.5rem, 5.5vw, 4rem)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em" }}>
          Autonomous<br /><span className="gradient-text">Merchant Finance</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: 520, margin: "20px auto 0", lineHeight: 1.65 }}>
          SmartSplit checkout, 9 AI agents, and instant stablecoin settlement on Tempo. Gasless UX powered by Privy.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32 }}>
          <Link href="/dashboard" className="btn-primary" style={{ padding: "12px 28px", fontSize: "0.88rem" }}>Launch Dashboard</Link>
          <Link href="/ai" className="btn-secondary" style={{ padding: "12px 28px", fontSize: "0.88rem" }}>AI Command Center</Link>
        </div>
      </section>

      {/* Features */}
      <section className="container" style={{ paddingBottom: 80, position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
          {features.map((f) => (
            <div key={f.title} className="glass-card" style={{ padding: 24 }}>
              <div style={{ marginBottom: 16, height: 40, width: 40, background: "var(--accent)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-foreground)" }}>
                {f.icon}
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: 6 }}>{f.title}</div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container" style={{ paddingBottom: 80, position: "relative", zIndex: 1 }}>
        <h2 style={{ textAlign: "center", fontSize: "1.8rem", fontWeight: 800, marginBottom: 40, letterSpacing: "-0.03em" }}>
          How <span className="gradient-text">SmartSplit</span> Works
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {steps.map((s, i) => (
            <div key={s.n} className="card" style={{ textAlign: "center", padding: 28, position: "relative" }}>
              {i < steps.length - 1 && (
                <div style={{
                  position: "absolute", top: "50%", right: -8, width: 16, height: 2,
                  background: "var(--border-hover)", display: "none",
                }} />
              )}
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--gradient-accent)",
                color: "var(--primary-foreground)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.82rem", fontWeight: 700, marginBottom: 14,
              }}>
                {s.n}
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 6 }}>{s.title}</div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="container" style={{ paddingBottom: 80, position: "relative", zIndex: 1 }}>
        <div className="card" style={{ padding: "40px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", textAlign: "center" }}>
            {[
              { v: "9", l: "AI Agents" },
              { v: "<1s", l: "Settlement" },
              { v: "$0", l: "Gas Fees" },
              { v: "3", l: "Stablecoin Rails" },
            ].map((s) => (
              <div key={s.l}>
                <div className="gradient-text" style={{ fontSize: "2.4rem", fontWeight: 900 }}>{s.v}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", paddingBottom: 100, position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 10 }}>
          Ready to <span className="gradient-text">get started</span>?
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: 24 }}>
          Seed demo data and explore the full agent ecosystem in under 30 seconds.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/api/seed" className="btn-secondary" style={{ padding: "12px 24px" }}>Seed Demo Data</Link>
          <Link href="/dashboard" className="btn-primary" style={{ padding: "12px 24px" }}>Open Dashboard</Link>
        </div>
      </section>
    </div>
  );
}
