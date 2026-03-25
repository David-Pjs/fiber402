# Fiber-402

**The payment layer the internet forgot to build. Now running on CKB Fiber Network.**

Live demo: [fiber-402.vercel.app](https://fiber-402.vercel.app)

---

## The Internet Has Had a Broken Payment Code for 30 Years

```
HTTP 402 - Payment Required
```

Every browser, every server, every API in the world supports this status code. It was defined in 1996. The idea was simple: a server says "pay me first", the client pays, and gets access. Others have tried to implement it (Coinbase x402 on Base, Lightning L402) but gas fees and settlement constraints make true micropayments unviable on those rails.

So instead, we got accounts. Subscriptions. Credit cards. Monthly plans.

---

## Africa Already Showed Us a Better Model

MTN, Airtel, and Glo did not sell subscriptions. They sold airtime. You load what you need, you use what you load. M-Pesa built an entire financial system on per-transaction micropayments. No monthly fees. No minimum balance. Pay for exactly what you use, when you use it.

People do not want to pay for what they might use. They want to pay for what they actually use. Per minute. Per MB. Per call.

The Silicon Valley subscription model is a Western assumption. Most of the world already moved past it.

**Now the internet needs to catch up.**

---

## AI Agents Are About to Break the Old Model Entirely

An AI agent can browse, call APIs, analyze data, and take actions without any human. But it cannot open a bank account. It cannot enter a credit card. It cannot approve a monthly subscription.

There are already millions of AI agents making billions of API calls. Others are building payment infrastructure for this - but they are building products: wallets, custodians, managed services. All require a human to set up and approve. That breaks when agents run autonomously at scale.

The right solution is a protocol. Two lines on any API. Any agent pays automatically. No setup, no account, no human approval.

**Fiber-402 is that protocol - and CKB Fiber is the only rail where $0.001 per-request payments are economically viable.**

---

## How It Works

```
1.  Agent requests a resource
    GET /api/market-data

2.  Server responds: payment required
    HTTP 402
    { "invoice": "lnckb1...", "amount": "0.001", "asset": "CKB" }

3.  Agent pays instantly via Fiber channel
    sendPayment(invoice)  ->  ~340ms

4.  Agent retries with payment proof
    GET /api/market-data
    X-Fiber-Payment: <invoice>

5.  Server verifies and responds
    HTTP 200 OK
    { "price": "$0.0124", "market_cap": "$1.07B" }
```

No accounts. No subscriptions. No humans in the loop.

---

## Using the App

**Try it now at [fiber-402.vercel.app](https://fiber-402.vercel.app)**

When you open the app, a personal demo wallet is automatically created for you in your browser. It starts with 10 CKB. No signup, no wallet extension, no setup.

**Step 1 - Ask the agent anything**

Click one of the example prompts or type your own question. The agent decides which services to call, pays for them automatically, and returns a full answer.

```
"What is CKB trading at right now?"
"Give me a full network health report"
"How active is the CKB blockchain today?"
```

**Step 2 - Watch the payment happen**

As the agent works, you will see:

- The sidebar steps light up: Request - 402 - Pay - Unlock
- A full-screen payment flash showing the CKB amount and transaction hash
- The live payment feed on the right updating in real time
- Your wallet balance in the nav decreasing with each payment

**Step 3 - Start Autopilot**

Hit the Autopilot button and the agent runs itself every 12 seconds. It picks tasks, calls services, pays for data, and reports results with zero human input. Your balance drains in real time. This is what autonomous machine payments look like.

**Step 4 - Refill and repeat**

If your balance runs low, hit "refill to 10 CKB" under your wallet card and keep going.

---

## 4 Live Services (all gated behind HTTP 402)

| Service | Cost | What it does |
|---|---|---|
| CKB Oracle | 0.001 CKB | Live price, market cap, 24h volume |
| AI Summarizer | 0.010 CKB | Summarizes any topic using AI |
| Chain Analytics | 0.005 CKB | Transactions, active addresses, hash rate |
| Fiber Stats | 0.002 CKB | Network nodes, channels, total capacity |

---

## For Developers: Add x402 to Any API in 2 Lines

```ts
// src/lib/payment-402.ts is already in this repo - copy it to any project
import { require402 } from './payment-402';

// Add to any Next.js route handler:
export async function GET(req: NextRequest) {
  const { valid } = await verifyPaymentHeader(req);
  if (!valid) return require402({ serviceId: 'my-api', amount: 0.01, description: 'My data' });
  return NextResponse.json({ data: '...' });
}
```

That is all. Any AI agent that understands the x402 protocol will automatically pay and retry. No SDK required on the agent side. It is just HTTP.

---

## Why CKB Fiber Network

| | USDC on Base (x402 original) | CKB Fiber (Fiber-402) |
|---|---|---|
| Min viable payment | ~$0.01 (gas fees) | $0.0001 (zero channel fees) |
| Settlement speed | ~2 seconds | Milliseconds |
| Channel setup | Per transaction | Once, then unlimited |
| Works for $0.001 micropayments | No | Yes |

Coinbase built x402 on Base. Great idea, wrong rail. Fiber is the only network where per-request micropayments are actually viable.

---

## Architecture

```
+----------------------------------------------------------+
|                       Fiber-402                          |
+------------------+------------------+--------------------+
|   Server SDK     |  Payment Layer   |   Agent Layer      |
|                  |                  |                    |
|  require402()    |  Fiber Node RPC  |  AI Agent          |
|  middleware      |  - new_invoice   |  Tools:            |
|                  |  - send_payment  |  - fetch_service() |
|  Drop into any   |  - verify_payment|  - list_services() |
|  Next.js or      |  - open_channel  |  - check_balance() |
|  Express app     |  mock fallback   |                    |
+------------------+------------------+--------------------+
                           |
               CKB Fiber Network
               Instant - Feeless - Trustless
```

---

## Tech Stack

- Next.js 15 + TypeScript
- AI agent with autonomous tool use and streaming SSE responses
- CKB Fiber Network (real node running, 10,000 testnet CKB funded)
- x402 middleware at `src/lib/payment-402.ts`
- Graceful mock fallback when node is unreachable

---

## Run Locally

```bash
git clone https://github.com/David-Pjs/fiber402
cd fiber402
npm install
```

Create `.env.local`:

```
ANTHROPIC_API_KEY=your_key
ANTHROPIC_BASE_URL=https://api.anthropic.com
AI_MODEL=claude-haiku-4-5-20251001

# Optional: connect a real Fiber node
# FIBER_NODE_RPC_URL=http://127.0.0.1:8227
# FIBER_CURRENCY=Fibt
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Without a Fiber node, all payments fall back to mock automatically. The UI looks and behaves identically.

---

## The Vision

Stripe did not invent payments. They made payments easy enough that every developer could use them. Within five years, most internet commerce ran through them.

Fiber-402 does the same thing for machine-to-machine payments. Any developer can monetize any API. Any agent can pay for what it needs. No subscriptions. No accounts. Pay for exactly what you use.

Africa proved this model wins. The programmable internet is next.

---

Built for the **Claw and Order: CKB AI Agent Hackathon**, March 2026.
