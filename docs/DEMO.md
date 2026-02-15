# Modulo Demo GuideScript

## Quick Setup (Local)

```bash
# 1. Clone and install
cd Modulo
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your keys:
#   PRIVY_APP_ID, PRIVY_APP_SECRET
#   SPONSOR_PRIVATE_KEY (funded on Tempo testnet)
#   GROQ_API_KEY (free from console.groq.com)
#   DATABASE_URL=file:./dev.db

# 3. Push database schema
npx prisma db push

# 4. Seed sample data
npm run dev
# Visit http://localhost:3000/api/seed

# 5. Open dashboard
# Visit http://localhost:3000
```

---

## 90-Second Pitch Script

> "AgentMesh is autonomous merchant finance. Nine AI agents handle everything from checkout to payout — SmartSplit splits payments atomically, Fraud Sentinel blocks threats, Cash Optimizer manages treasury, and Subscription Guardian recovers failed payments. All on Tempo with instant stablecoin settlement and Privy for zero-friction onboarding. We've overhauled the UI with a premium dark mode and added QR code payments for a complete hackathon-ready experience. No gas fees, no manual reconciliation, no revenue left on the table."

---

## 3-Minute Live Demo

### Step 1: Dashboard (30s)
- Open `/dashboard`
- **Visuals**: Show off the new dark mode, glassmorphism cards, and the "Connected to Tempo Testnet" status.
- Show: pending orders, settled transactions, revenue metrics.
- Action: Click the **QR Code icon** on a pending order to show the instant payment modal.

### Step 2: Checkout Flow (60s)
- Navigate to `/checkout/<orderId>` (use a pending order)
- **Feature**: Toggle "Show Payment QR Code" to demonstrate mobile-first payment readiness.
- Click "Confirm Payment"
- Show: spinner → "Settlement Complete" with tx hash
- Click explorer link → show atomic split transfers with memo `order:<id>:split:v1`
- Explain: "One click, three recipients paid atomically. Zero gas for the customer."

### Step 3: AI Command Center (45s)
- Navigate to `/ai`
- Show each tab: Overview, Revenue, Pricing, Cash, Growth
- Scroll to AI narrative cards (Health Score, Action Plan).
- Explain: "Each agent runs algorithmic analysis THEN generates strategic insights via Groq LLM. Not just data — actionable intelligence."

### Step 4: Bulk Payouts (30s)
- Navigate to `/payouts`
- Action: Click **"Load Sample CSV"** for instant demo data.
- Click Execute → show parallel nonce lane results
- Explain: "100 recipients, parallel execution, idempotent, with AI operational analysis."

### Step 5: All 9 Agents (15s)
- Navigate to `/agents`
- Show: 9/9 active, each with features and endpoints.
- Explain: "Every agent is live — SmartSplit, Reconciliation, Revenue Forecaster, Smart Pricing, Cash Optimizer, Fraud Sentinel, Business Insights, Subscription Guardian, and Payout Orchestrator."

---

## Fallback Plan

If testnet is flaky during demo:
1. Show the dashboard with seeded data (works offline)
2. Show AI Command Center (Groq calls work independently)
3. Show CSV Payouts preview (parsing works entirely client-side)
4. Reference the architecture diagram in `/docs/architecture.md`

---

## Key Tempo Primitives Demonstrated

| Primitive | Where |
|-----------|-------|
| Atomic batch splits | SmartSplit → Checkout |
| Transfer memos | All agents (order:ID:split:v1) |
| Fee sponsorship | Checkout execute (feePayer) |
| Parallel nonces | Payout Orchestrator (nonce lanes) |
| Explorer integration | Transaction links throughout |
| TIP-20 stablecoin | AlphaUSD in all transfers |
