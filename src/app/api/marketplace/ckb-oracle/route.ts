import { NextRequest, NextResponse } from "next/server";
import { require402, verifyPaymentHeader } from "@/lib/payment-402";

export async function GET(req: NextRequest) {
  const { valid } = await verifyPaymentHeader(req);

  if (!valid) {
    return require402({
      serviceId: "ckb-oracle",
      amount: 0.001,
      description: "Real-time CKB price and market data",
    });
  }

  // Payment verified - return the data
  return NextResponse.json({
    service: "CKB Oracle",
    data: {
      price_usd: 0.0124,
      price_btc: 0.00000013,
      market_cap_usd: 1_073_000_000,
      volume_24h_usd: 28_400_000,
      change_24h_pct: 3.2,
      total_supply: "44,280,000,000 CKB",
      circulating_supply: "21,200,000,000 CKB",
      network: "Nervos CKB Mainnet",
      block_height: 14_280_442,
      hash_rate: "183 PH/s",
      last_updated: new Date().toISOString(),
    },
  });
}
