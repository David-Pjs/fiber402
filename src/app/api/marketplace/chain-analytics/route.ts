import { NextRequest, NextResponse } from "next/server";
import { require402, verifyPaymentHeader } from "@/lib/payment-402";

export async function GET(req: NextRequest) {
  const { valid } = await verifyPaymentHeader(req);

  if (!valid) {
    return require402({
      serviceId: "chain-analytics",
      amount: 0.005,
      description: "On-chain stats for CKB network",
    });
  }

  return NextResponse.json({
    service: "Chain Analytics",
    data: {
      total_transactions_24h: 142_800,
      active_addresses_24h: 18_340,
      new_cells_created: 84_200,
      cells_consumed: 79_100,
      avg_fee_per_tx: "0.0021 CKB",
      total_ckb_locked_in_scripts: "3,280,000,000 CKB",
      dao_deposited: "8,940,000,000 CKB",
      top_scripts: [
        { name: "Secp256k1", txs: 98400 },
        { name: "Nervos DAO", txs: 18200 },
        { name: "Fiber Channel", txs: 12400 },
        { name: "RGB++ Assets", txs: 9800 },
      ],
      last_updated: new Date().toISOString(),
    },
  });
}
