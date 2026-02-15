# Modulo Architecture Overview

## System Architecture

```mermaid
flowchart LR
  subgraph Web["Frontend (Next.js)"]
    A[Customer Browser] -->|Checkout widget| B[Frontend]
    C[Merchant Dashboard] --> B
  end

  subgraph Backend["AgentMesh Backend"]
    B --> D[API Gateway]
    D --> E[Orchestrator]
    E --> F[Agent Bus]
    F --> G1[SmartSplit]
    F --> G2[Sub Guardian]
    F --> G3[Cash Optimizer]
    F --> G4[Fraud Sentinel]
    F --> G5[Payout Orch]
    F --> G6[Reconciliation]
    F --> G7[Revenue Forecast]
    F --> G8[Smart Pricing]
    F --> G9[Business Insights]
    D --> I[Privy Auth]
    D --> J[SQLite/Postgres]
    D --> K[Groq LLM]
  end

  subgraph Tempo["Tempo Network"]
    G1 -->|viem + tempoActions| M[Tempo Moderato]
    G5 -->|Parallel nonce lanes| M
    M -->|Explorer links| B
  end
```

## Data Flow

```mermaid
sequenceDiagram
    participant C as Customer
    participant F as Frontend
    participant A as API
    participant SS as SmartSplit Agent
    participant T as Tempo Network
    participant R as Reconciliation Agent
    participant DB as Database

    C->>F: Click Pay
    F->>A: POST /checkout/create-order
    A->>DB: Create Order (pending)
    A-->>F: orderId

    F->>A: POST /checkout/execute
    A->>SS: Execute split (85/10/5)
    SS->>T: Atomic batch transfer
    T-->>SS: txHash
    SS->>DB: Store transactions
    A->>DB: Order → settled
    A-->>F: txHash + explorer link

    T->>R: TransferWithMemo event
    R->>DB: Match memo → order
    R->>DB: Confirm settlement
```

## Agent Architecture

Each agent implements:
- **Event triggers**: HTTP requests, webhooks, scheduled scans
- **Analysis engine**: Algorithmic computation on DB data
- **LLM layer**: Groq-powered strategic narrative generation
- **Health endpoint**: Status, uptime, capabilities

| Agent | Type | Trigger | Groq Model |
|-------|------|---------|------------|
| SmartSplit | Transaction | HTTP (checkout) | — |
| Reconciliation | Settlement | Webhook (events) | — |
| Revenue Forecaster | Analytics | HTTP (API call) | llama-3.3-70b |
| Smart Pricing | Analytics | HTTP (API call) | llama-3.3-70b |
| Cash Optimizer | Treasury | HTTP (API call) | llama-3.3-70b |
| Fraud Sentinel | Security | HTTP (pre-settlement) | llama-3.3-70b |
| Business Insights | Intelligence | HTTP (API call) | llama-3.3-70b |
| Subscription Guardian | Retention | Webhook (failures) | llama-3.3-70b |
| Payout Orchestrator | Bulk ops | HTTP (CSV upload) | llama-3.3-70b |

## Memo Convention

- Order settlements: `order:<orderId>:split:v1`
- Agent-to-agent payments: `agentpay:<agentId>:<invoiceId>`
- Subscription retries: `sub:<userId>:retry<N>`

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React, CSS |
| Auth | Privy (email/phone/wallet) |
| Blockchain | Tempo Moderato (viem, tempoActions) |
| Database | SQLite (dev) / Postgres (prod) via Prisma |
| AI/LLM | Groq (Llama 3.3 70B) |
| Token standard | TIP-20 (AlphaUSD stablecoin) |
