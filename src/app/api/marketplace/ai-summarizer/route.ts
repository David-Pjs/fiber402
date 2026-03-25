import { NextRequest, NextResponse } from "next/server";
import { require402, verifyPaymentHeader } from "@/lib/payment-402";
import { getAiSummarizerData } from "@/lib/service-data";

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
  const result = await getAiSummarizerData(topic);
  return NextResponse.json(result);
}
