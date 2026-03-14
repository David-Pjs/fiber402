import { NextResponse } from "next/server";
import { getNodeInfo, listPeers, getBalance, getNetworkGraph } from "@/lib/fiber";

export async function GET() {
  const [info, peers, balance, graph] = await Promise.all([
    getNodeInfo(),
    listPeers(),
    getBalance(),
    getNetworkGraph(),
  ]);

  return NextResponse.json({
    node: info,
    peers,
    balance_ckb: balance,
    network: {
      nodes: graph.nodes.length,
      channels: graph.channels.length,
      total_capacity_ckb: Math.round(graph.total_capacity_ckb),
      is_mock: graph.is_mock,
    },
    rpc_url: process.env.FIBER_NODE_RPC_URL || "http://127.0.0.1:8227",
    currency: process.env.FIBER_CURRENCY || "Fibt",
  });
}
