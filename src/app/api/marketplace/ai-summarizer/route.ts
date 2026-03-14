import { NextRequest, NextResponse } from "next/server";
import { require402, verifyPaymentHeader } from "@/lib/payment-402";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

const MODEL = process.env.AI_MODEL || "claude-haiku-4-5-20251001";

export async function POST(req: NextRequest) {
  const { valid } = await verifyPaymentHeader(req);

  if (!valid) {
    return require402({
      serviceId: "ai-summarizer",
      amount: 0.01,
      description: "Claude summarizes any topic",
    });
  }

  const body = await req.json();
  const topic = body.topic || "the Nervos CKB ecosystem";

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    messages: [{ role: "user", content: `Summarize this topic in 3-4 concise sentences for a crypto developer: ${topic}` }],
  });

  const summary = message.content[0].type === "text" ? message.content[0].text : "";
  return NextResponse.json({ service: "AI Summarizer", topic, summary });
}
