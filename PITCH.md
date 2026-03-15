# Fiber-402: The Payment Layer for AI Agents

**One line:** HTTP 402 + CKB Fiber Network = the first payment protocol built for machines, not humans.

---

## The Hook

The internet has had a broken payment code for 30 years.

`HTTP 402 - Payment Required`

Every browser, every server, every API in the world supports it. It was supposed to be the native payment layer of the web. It never worked, because the internet never built what goes behind it.

So instead, we got accounts. Subscriptions. Credit cards. Monthly plans. That worked fine when humans were the only users.

---

## A Lesson From the Real World

Africa already showed us a better model.

MTN, Airtel, Glo did not sell subscriptions. They sold airtime. You load what you need, you use what you load. Showmax tried the Netflix model in Nigeria. It struggled. Flex pricing saved it.

Why? Because people do not want to pay for what they might use. They want to pay for what they actually use. Per minute. Per MB. Per call.

The Silicon Valley subscription model is a Western assumption. The rest of the world already moved past it.

---

## Now AI Agents Are About to Break the Internet's Payment Model Entirely

An AI agent can browse, call APIs, analyze data, and take actions autonomously. But it cannot open a bank account. It cannot enter a credit card. It cannot approve a monthly charge.

There are already millions of AI agents making billions of API calls. That number doubles every few months. The payment infrastructure for this does not exist.

---

## The Solution: Fiber-402

When an agent requests a resource:

```
GET /api/market-data
  <- 402 Payment Required + invoice
  -> sendPayment(invoice)   [milliseconds, CKB Fiber Network]
  -> GET /api/market-data   [with payment proof]
  <- 200 OK + data
```

No account. No card. No subscription. No human. Pay for exactly what you use, instantly.

This is what HTTP 402 was always supposed to do.

---

## Why CKB Fiber Network

| | Ethereum L2 (Base) | CKB Fiber |
|---|---|---|
| Min payment | ~$0.01 | $0.0001 |
| Settlement | ~2 seconds | milliseconds |
| Channel fees | Gas costs | Zero |

Fiber is the only network fast and cheap enough for per-request AI agent payments at scale.

---

## The Developer Experience

Any developer adds x402 in two lines:

```js
import { require402 } from 'fiber-402';
app.get('/my-data', require402({ amount: 0.01 }), handler);
```

Any agent pays automatically. No SDK needed on the agent side. It is just HTTP.

---

## Live Demo

**Web app:** https://fiber-402.vercel.app
**Telegram bot:** @Fiber402Bot
**Zero setup. Your own wallet generated instantly. Works immediately.**

What you will see:

1. Open the app - your personal demo wallet is created automatically
2. Click any example prompt - agent runs instantly, no submit button
3. Watch the sidebar - x402 protocol steps light up in real time
4. Watch the payment flash - full screen toast shows CKB amount and tx hash
5. Watch the live feed - every payment logged with service name and hash
6. Start Autopilot - agent runs itself every 12 seconds, spending CKB autonomously

### 4 Live Services (all behind HTTP 402)

| Service | Cost | What it does |
|---|---|---|
| CKB Oracle | 0.001 CKB | Live price and market data |
| AI Summarizer | 0.010 CKB | Summarizes any topic using AI |
| Chain Analytics | 0.005 CKB | On-chain transactions, addresses, hash rate |
| Fiber Stats | 0.002 CKB | Network nodes, channels, capacity |

---

## What This Enables

Once HTTP 402 works, everything online can become pay-per-use:

- APIs and data feeds
- AI compute billed per second
- Digital files, music, articles
- Freelancer work released on delivery
- IoT sensor readings
- Anything with a URL

**Developers** monetize any API without Stripe, without accounts, without monthly plans.
**AI agents** become economic actors. They buy what they need, when they need it.
**End users** pay only for what they actually consume.
**The ecosystem** routes money directly from consumer to producer with zero intermediary cut.

---

## The Vision

Stripe did not invent payments. They made payments easy enough that every developer could use them. Within five years, most internet commerce ran through them.

Fiber-402 does something similar for the next internet. It makes machine-to-machine payments simple enough that any developer can monetize any API, and any agent can pay for what it needs.

Africa proved that pay-as-you-go wins. MTN did not sell subscriptions - they sold airtime.

Fiber-402 brings that same model to the programmable internet.

This is the Stripe moment for the agentic internet.

---

## Tech Stack

- Next.js 15 + TypeScript
- AI agent with autonomous tool use and streaming responses
- CKB Fiber Network, real node running, 10,000 testnet CKB funded
- x402 middleware (src/lib/payment-402.ts)
- Streaming SSE for real-time UI updates

---

## Built solo at the CKB Fiber Hackathon, March 2026.

**Fiber Node peer ID:** QmTywJAuypWuV4mzMjuiqnU6KzMxUh9fK9ZRq5H65XqJdw
