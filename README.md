# Fiber-402

> The missing payment layer for AI agents — built on CKB Fiber Network.

---

## The Problem

The internet has a billing problem that nobody noticed until AI agents arrived.

Every API on the internet assumes a human is paying. You need an email, a credit card, a subscription plan, an API key. It takes minutes to set up and costs at minimum $5-10/month — even if you only need $0.001 worth of data.

AI agents can't sign up for accounts. They can't enter credit cards. They just need data, right now, for fractions of a cent. The entire billing infrastructure of the internet is incompatible with how AI agents work.

**This is the problem Fiber-402 solves.**

---

## The Solution

In 1991, when HTTP was invented, engineers included a status code called `402 Payment Required`. The idea: a server could say "pay me first", the client would pay, and get access. It was never implemented — because there was no way for software to pay software automatically.

In 2025, Coinbase revived this idea with the **x402 protocol**, using USDC on Base (Ethereum). Great idea. Wrong payment rail — $0.01 minimum fees make $0.001 micropayments economically impossible.

**Fiber-402 implements x402 on CKB's Fiber Network** — a Lightning-like payment channel system where:
- Payments are **instant** (milliseconds)
- Fees are **zero** inside a channel
- Micropayments of **0.001 CKB** are completely viable

Now AI agents can pay for exactly what they use, autonomously, in real time.

---

## How It Works

```
1. Agent requests a resource
   GET /api/ckb-price

2. Server responds with 402
   HTTP 402 Payment Required
   { "amount": "0.001", "asset": "CKB", "invoice": "lnbc..." }

3. Agent pays automatically via Fiber channel
   (instant, no human needed)

4. Agent retries with payment proof
   GET /api/ckb-price
   X-Payment: <signed proof>

5. Server verifies and responds
   HTTP 200 OK
   { "price": "$0.012" }
```

Total time: under 1 second. No accounts. No subscriptions. No humans.

---

## Live Demo

Fiber-402 ships with a live marketplace of 4 real services — all gated behind 402 payment walls:

| Service | What it does | Price |
|---|---|---|
| CKB Oracle | Real-time CKB price + market data | 0.001 CKB |
| AI Summarizer | Claude summarizes any URL | 0.010 CKB |
| Chain Analytics | On-chain stats for any CKB address | 0.005 CKB |
| Fiber Stats | Live Fiber Network channel data | 0.002 CKB |

A built-in Claude AI agent is given a task and autonomously navigates the marketplace — hitting 402 walls, paying via Fiber, consuming the data, and reporting results. Every payment is visible on the live dashboard in real time.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Fiber-402                             │
├─────────────────┬───────────────────┬───────────────────────┤
│   Server SDK    │   Payment Layer   │    Agent Layer         │
│                 │                   │                        │
│  payment-402    │  Fiber Node RPC   │  Claude Agent          │
│  middleware     │  - new_invoice    │  Tools:                │
│                 │  - send_payment   │  - http_get(url)       │
│  Drop into any  │  - verify_payment │  - pay_invoice(req)    │
│  Next.js /      │  - open_channel   │  - check_balance()     │
│  Express app    │  - auto channel   │  - list_services()     │
│                 │    management     │                        │
└─────────────────┴───────────────────┴───────────────────────┘
```

---

## Tech Stack

- **AI**: Claude claude-sonnet-4-6 via Anthropic API (tool use for autonomous payments)
- **Payments**: CKB Fiber Network (payment channels, invoices, instant settlement)
- **Backend**: Next.js API routes (TypeScript)
- **Frontend**: Next.js + Tailwind CSS + shadcn/ui
- **On-chain**: CKB Fiber Node (channel funding, settlement)

---

## Why Fiber Over USDC/Base

| | USDC on Base (x402) | CKB on Fiber (Fiber-402) |
|---|---|---|
| Min viable payment | ~$0.01 (fees) | $0.0001 (zero channel fees) |
| Settlement speed | ~2 seconds | Milliseconds |
| Channel setup | Per transaction | Once, then unlimited payments |
| Asset flexibility | USDC only | CKB + any UDT token |

---

## Setup

```bash
git clone https://github.com/yourusername/fiber-402
cd fiber-402
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY
# Add your FIBER_NODE_RPC_URL (when server is ready)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Hackathon

Built for the **Claw & Order: CKB AI Agent Hackathon** (March 2026).

Fiber-402 is the CKB ecosystem's answer to x402 — bringing autonomous AI agent micropayments to the fastest, cheapest payment network in the CKB world.
