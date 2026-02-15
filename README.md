# Modulo — Autonomous Merchant Infrastructure

**SmartSplit checkout, 9 autonomous AI agents, and instant stablecoin settlement on Tempo.**

> Zero-gas payments powered by Privy embedded wallets and Tempo's fee-sponsored architecture.

AgentMesh -- Autonomous merchant finance: SmartSplit checkout, Subscription Guardian, Cash Optimizer, Fraud Sentinel, Payout Orchestrator, and Reconciliation agents. Uses Tempo for instant stablecoin rails and Privy for email/phone wallet provisioning. Gasless UX, atomic splits, high-throughput payouts, DEX-based liquidity management, agent-to-agent payments, and full auditability.

---

## Features

| Feature | Description |
|---------|-------------|
| **SmartSplit Checkout** | Atomic multi-party payment splits (merchant, platform, royalty) in a single Tempo transaction |
| **9 AI Agents** | Revenue Forecast, Smart Pricing, Cash Optimizer, Fraud Sentinel, Subscription Guardian, Payout Orchestrator, Reconciliation, Business Insights |
| **Dark Mode UI** | Premium glassmorphism design with gradient accents and neon glow effects |
| **QR Code Payments** | Instant checkout via QR codes for mobile users |
| **CSV Bulk Payouts** | Upload CSV, parallel nonce lanes, per-recipient status tracking with AI ops analysis |
| **Groq LLM Layer** | Strategic AI narratives powered by Llama 3.3 70B on every agent |
| **Google/Email/SMS Login** | One-click auth via Privy -- no seed phrases |
| **Embedded Wallets** | Auto-created wallets for every user |
| **Gasless Transactions** | Sponsor wallet pays all fees |
| **Webhook Reconciliation** | Automatic tx matching via on-chain memos |
| **Subscription Guardian** | Exponential backoff retries + backup wallet detection |

---

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full Mermaid diagrams and data flow.

```
Customer --> Frontend (Next.js) --> API Gateway --> 9 Agents --> Tempo Network
                                        |               |
                                   Privy Auth     Groq LLM (Llama 3.3)
                                        |               |
                                   SQLite/Postgres   Explorer Links
```

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Chain**: Tempo Moderato (Chain ID 42431)
- **Auth**: Privy (Google, Email, SMS, Wallet)
- **Blockchain SDK**: Viem + tempoActions
- **ORM**: Prisma (SQLite dev / Postgres prod)
- **AI**: Groq SDK (Llama 3.3 70B Versatile)
- **Styling**: Custom CSS design system (Dark Mode)

---

## Getting Started

```bash
# Install
npm install

# Configure environment
cp .env.example .env
# Set: PRIVY_APP_ID, PRIVY_APP_SECRET, SPONSOR_PRIVATE_KEY, GROQ_API_KEY

# Push schema
npx prisma db push

# Dev server
npm run dev

# Seed demo data
# Visit http://localhost:3000/api/seed
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
agents/                        # 9 autonomous agents
  smart-split/                 # Atomic batch payment splits
  reconciliation/              # Memo-based settlement matching
  revenue-forecaster/          # Revenue projection + trends
  smart-pricing/               # Dynamic price optimization
  cash-optimizer/              # Treasury + DEX liquidity
  fraud-sentinel/              # Pre-settlement risk scoring
  business-insights/           # Executive intelligence
  subscription-guardian/       # Failed payment recovery
  payout-orchestrator/         # CSV bulk payouts + nonce lanes
src/
  app/
    page.tsx                   # Landing page
    dashboard/                 # Merchant dashboard
    checkout/                  # SmartSplit checkout
    agents/                    # Agent marketplace (9/9 active)
    ai/                        # AI command center (5 tabs)
    payouts/                   # CSV bulk payout uploader
    logs/[id]/                 # Run detail + retry
    api/
      checkout/                # create-order + execute
      ai/                      # insights + risk-check
      subscriptions/retry/     # Subscription Guardian
      payouts/csv/             # Payout Orchestrator
      webhooks/tempo/tx/       # TX confirmation webhook
      netting/[runId]/retry/   # Failed run retry
      transactions/[txHash]/   # TX detail + explorer link
  lib/
    tempo.ts                   # Tempo client, batch calls, memos
    groq.ts                    # Shared Groq LLM client
    privy.ts                   # Server-side Privy client
    db.ts                      # Prisma client
    components/
      PaymentQR.tsx            # QR code components
docs/
  architecture.md              # Mermaid diagrams + data flow
  DEMO.md                      # 90s pitch + 3min demo script
```

---

## Demo

See [docs/DEMO.md](docs/DEMO.md) for the full demo script, pitch, and fallback plan.

---

## Tempo Testnet

| Property | Value |
|----------|-------|
| Chain ID | `42431` |
| RPC URL | `https://rpc.moderato.tempo.xyz` |
| Explorer | `https://explore.tempo.xyz` |
| AlphaUSD | `0x20c0...0001` |

---

## License

MIT
