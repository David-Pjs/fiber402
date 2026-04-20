# x402-fiber-sdk

**Add CKB Fiber payments to any Node.js API in under 10 minutes.**

```ts
import { fiberPaywall } from '@x402-fiber/express'

app.get('/data', fiberPaywall({ price: '0.001 CKB' }), handler)
```

That's it. Your route now responds with HTTP 402, generates a Fiber invoice, verifies payment, and unlocks the response — automatically.

---

## What this is

[x402](https://x402.org) is a Linux Foundation protocol (April 2026) that operationalises HTTP 402 for machine-to-machine payments. Coinbase, Stripe, Cloudflare, Visa, Mastercard, Google, and AWS are all building for it.

Every existing x402 implementation settles on Base (Ethereum). Minimum payment: ~$0.01.

**CKB Fiber settles in milliseconds with zero channel fees.** Minimum payment: $0.0001. This SDK brings x402 to Fiber — the only rail where true micropayments are economically viable.

---

## Status

> **In active development.** This SDK is being built in public. Follow progress in [Discussions](https://github.com/David-Pjs/fiber402/discussions).

- [ ] `@x402-fiber/core` — invoice generation, payment verification, settlement
- [ ] `@x402-fiber/express` — Express middleware adapter
- [ ] `@x402-fiber/hono` — Hono middleware adapter
- [ ] `@x402-fiber/next` — Next.js route handler adapter
- [ ] `@x402-fiber/client` — client-side fetch wrapper (auto pay + retry)
- [ ] Live demo endpoint on funded Fiber mainnet node

---

## How it works

```
1. Client requests a resource
   GET /api/data

2. Server responds: payment required
   HTTP 402
   { "invoice": "fibt1...", "amount": "0.001", "asset": "CKB" }

3. Client pays via Fiber channel
   sendPayment(invoice)  →  ~340ms, zero fees

4. Client retries with payment proof
   GET /api/data
   X-Payment: <proof>

5. Server verifies and responds
   HTTP 200 OK + data
```

No accounts. No subscriptions. No humans in the loop.

---

## Why Fiber

| | x402 on Base | x402 on Fiber |
|---|---|---|
| Min viable payment | ~$0.01 (gas) | $0.0001 (zero channel fees) |
| Settlement speed | ~2 seconds | Milliseconds |
| Multi-asset channels | No | Yes (CKB, USDI, ccBTC, RGB++ assets) |
| Works for $0.001 micropayments | No | Yes |

---

## Prior work

This SDK grew out of [Fiber-402](https://fiber-402.vercel.app) — a proof-of-concept built for the Claw and Order: CKB AI Agent Hackathon (March 2026). The hackathon demo showed the full x402 flow working end-to-end with an AI agent. This repo is the next step: turning that proof-of-concept into a reusable SDK any developer can drop into their project.

---

## Dev logs

Progress is documented weekly in [Discussions](https://github.com/David-Pjs/fiber402/discussions).

---

## Run the demo locally

```bash
git clone https://github.com/David-Pjs/fiber402
cd fiber402
npm install
```

Create `.env.local`:

```
ANTHROPIC_API_KEY=your_key

# Optional: connect a real Fiber node
# FIBER_NODE_RPC_URL=http://127.0.0.1:8227
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without a Fiber node, payments fall back to mock automatically.

---

Built on [CKB Fiber Network](https://fiber.world). Implementing the [x402 protocol](https://x402.org).
