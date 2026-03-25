# Fiber-402: The Payment Layer for AI Agents

**One line:** HTTP 402 + CKB Fiber Network = the missing payment primitive for the agentic internet.

---

## The Hook

The internet has had a payment status code for 30 years.

`HTTP 402 - Payment Required`

Every browser, every server, every API supports it. It was supposed to be the native payment layer of the web. Others tried to implement it - Coinbase built x402 on Base, Lightning Labs built L402. Smart ideas. Wrong rails. Gas fees on Base make $0.001 payments uneconomical. Lightning works but requires two-sided coordination and has routing fees.

Fiber-402 is the implementation that actually works for AI agents - because CKB Fiber channels have zero fees after setup, settle in milliseconds, and support payments as small as a fraction of a cent.

---

## The Problem Nobody Is Solving Correctly

An AI agent can browse, call APIs, analyze data, and take actions autonomously. But it cannot open a bank account. It cannot enter a credit card. It cannot approve a monthly subscription.

The companies building agent infrastructure are solving the wrong problem. They are building wallets, custodians, and managed payment services - all of which require a human to set up, approve, and maintain. That works for today's semi-autonomous agents. It breaks completely when agents run continuously, talk to each other, and need to pay for thousands of micro-requests per hour.

The right solution is a protocol, not a product. Two lines of code on any API, and any agent can pay automatically. No human in the loop. No account. No subscription. Pay for exactly what you use.

---

## Why CKB Is the Right Chain for This

CKB has two properties that no other chain combines:

**1. Security for agent wallets that is not available elsewhere.**
CKB's lock scripts define exactly what conditions allow a cell to be spent. An agent wallet on CKB can only spend what its lock script permits. No smart contract can drain it without meeting those conditions. On Ethereum, a malicious contract can call back into your wallet and empty it. On CKB, that attack is structurally impossible. For an agent that manages its own funds autonomously, this is not a nice-to-have - it is a requirement.

**2. The only L2 rail where micropayments are economically viable.**
Fiber Network is CKB's payment channel protocol. Once a channel is open, payments route off-chain with zero fees. Not low fees - zero. There is no gas, no routing fee, no minimum amount. A $0.001 payment costs the same to route as a $100 payment. No other payment channel network offers this, because no other L1 designed its fee model to make it possible.

| | Coinbase x402 (Base L2) | Lightning L402 | CKB Fiber-402 |
|---|---|---|---|
| Min viable payment | ~$0.01 (gas) | ~$0.001 (routing fee) | $0.0001 (zero fees) |
| Settlement | ~2 seconds | seconds | milliseconds |
| Channel fees after setup | Gas per tx | Routing fees | Zero |
| Agent wallet security | Contract risk | Script risk | Lock script guarantee |

---

## The Solution: Fiber-402

When an agent requests a resource:

```
GET /api/market-data
  <- 402 Payment Required + Fiber invoice
  -> sendPayment(invoice)   [milliseconds, no fees]
  -> GET /api/market-data   [with payment proof header]
  <- 200 OK + data
```

No account. No card. No subscription. No human. Pay for exactly what you use.

The middleware that makes this work on the server side:

```ts
// src/lib/payment-402.ts - drop this into any Next.js or Express project
import { require402, verifyPaymentHeader } from './payment-402';

export async function GET(req: NextRequest) {
  const { valid } = await verifyPaymentHeader(req);
  if (!valid) return require402({ serviceId: 'my-api', amount: 0.001, description: 'My data' });
  return NextResponse.json({ data: '...' });
}
```

That is the entire server-side integration. Any AI agent that speaks HTTP can pay automatically - no SDK, no wallet extension, no setup. It is just HTTP.

---

## Live Demo

**Web app:** https://fiber-402.vercel.app
**Zero setup. Demo wallet generated instantly. Works immediately.**

What you will see:

1. Open the app - your personal demo wallet is created automatically, pre-loaded with CKB
2. Click any example prompt - agent runs instantly
3. Watch the sidebar - x402 protocol steps light up in sequence as the payment happens
4. Watch the payment flash - full-screen toast shows CKB amount and transaction hash
5. Watch the live feed - every payment logged with service name and hash
6. Start Autopilot - agent selects tasks and runs every 12 seconds with zero human input

### 4 Live Services (all gated behind HTTP 402)

| Service | Cost | What it does |
|---|---|---|
| CKB Oracle | 0.001 CKB | CKB price, market cap, 24h volume |
| AI Summarizer | 0.010 CKB | Claude summarizes any topic |
| Chain Analytics | 0.005 CKB | On-chain transactions, addresses, scripts |
| Fiber Stats | 0.002 CKB | Network nodes, channels, capacity |

---

## What This Enables

Any API can become pay-per-use with two lines of code:

- Data feeds and oracles
- AI compute billed per inference
- On-chain analytics
- IoT sensor readings
- Any resource with a URL and a price

**Developers** earn from every request without building billing, accounts, or Stripe integrations.
**AI agents** become economic actors - they buy what they need, when they need it, autonomously.
**Users** pay only for what they actually consume, not for a monthly plan they might not use.

---

## The Vision

Stripe did not invent credit card processing. They made it easy enough that any developer could add payments in an afternoon. The result was that most internet commerce ran through them within five years.

Fiber-402 is that moment for machine-to-machine payments. The middleware exists. The protocol is HTTP-native. Any developer can adopt it without learning a new stack. Any agent can pay without human approval.

The agentic internet needs a payment primitive, not a payment product. Fiber-402 is the primitive.

---

## Tech Stack

- Next.js 15 + TypeScript
- Claude Haiku agent with autonomous tool use and streaming SSE responses
- CKB Fiber Network (real node running at QmTywJAuypWuV4mzMjuiqnU6KzMxUh9fK9ZRq5H65XqJdw, 10,000 testnet CKB funded)
- x402 middleware at src/lib/payment-402.ts - 67 lines, drop into any project
- Graceful fallback to mock when node unreachable - demo never breaks

---

## Built solo at the Claw and Order: CKB AI Agent Hackathon, March 2026.
