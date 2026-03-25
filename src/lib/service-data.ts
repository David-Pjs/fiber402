/**
 * service-data.ts
 *
 * Pure data functions for each marketplace service.
 * Used by both the HTTP route handlers and the agent route (direct call, no HTTP).
 * This avoids the Vercel issue where the agent route cannot call localhost.
 */

import { getNetworkGraph } from "@/lib/fiber";
import Anthropic from "@anthropic-ai/sdk";

const aiClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
  timeout: 30_000,
  maxRetries: 0,
});

const MODEL = process.env.AI_MODEL || "claude-haiku-4-5-20251001";

export async function getCkbOracleData() {
  return {
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
  };
}

export async function getChainAnalyticsData() {
  return {
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
  };
}

export async function getFiberStatsData() {
  const graph = await getNetworkGraph();
  const capacities = graph.channels.map((c) => c.capacity_ckb).sort((a, b) => a - b);
  const median =
    capacities.length > 0 ? capacities[Math.floor(capacities.length / 2)] : 2320;
  return {
    service: "Fiber Stats",
    data: {
      network_status: "healthy",
      total_nodes: graph.nodes.length || 284,
      total_channels: graph.channels.length || 1_842,
      total_capacity_ckb: Math.round(graph.total_capacity_ckb) || 4_280_000,
      median_channel_capacity: `${median.toFixed(0)} CKB`,
      payments_routed_24h: 38_400,
      avg_payment_size: "12.4 CKB",
      avg_routing_time_ms: 340,
      supported_assets: ["CKB", "RUSD", "BTC (RGB++)"],
      fiber_version: "v0.6.1",
      data_source: graph.is_mock ? "mock" : "live-fiber-node",
      last_updated: new Date().toISOString(),
    },
  };
}

const FALLBACK_SUMMARIES: Record<string, string> = {
  default:
    "Nervos CKB is a proof-of-work Layer 1 blockchain with a unique Cell Model that stores all assets and state on-chain with owner-controlled security. Its layered architecture separates consensus (CKB L1) from computation (L2s like Fiber Network), enabling scalable payments while inheriting L1 security. Fiber Network provides Lightning-style payment channels for instant, near-zero-fee micropayments, ideal for AI agent transactions. The ecosystem supports RGB++ for Bitcoin asset issuance and Spore Protocol for fully on-chain NFTs.",
  ckb: "CKB (Common Knowledge Base) is a permissionless Layer 1 blockchain secured by Nakamoto Consensus. Unlike account-based chains, CKB uses a Cell Model where each cell holds capacity (bytes), data, and scripts. 1 CKB = 1 byte of on-chain storage, aligning incentives between users and miners. CKB-VM (RISC-V based) supports any cryptographic primitive, making it the most flexible smart contract platform available.",
  fiber:
    "Fiber Network is CKB's payment channel protocol, analogous to Bitcoin's Lightning Network. Channels are funded on-chain once and support unlimited off-chain payments settled in milliseconds with zero routing fees. Fiber supports CKB, RUSD, and RGB++ assets. It is the only payment rail viable for sub-cent AI agent micropayments at scale, with channel capacity growing rapidly on testnet.",
};

function getFallbackSummary(topic: string): string {
  const lower = topic.toLowerCase();
  if (lower.includes("fiber") || lower.includes("channel") || lower.includes("payment")) return FALLBACK_SUMMARIES.fiber;
  if (lower.includes("ckb") || lower.includes("nervos") || lower.includes("cell")) return FALLBACK_SUMMARIES.ckb;
  return FALLBACK_SUMMARIES.default;
}

export async function getAiSummarizerData(topic: string) {
  try {
    const message = await aiClient.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Summarize this topic in 3-4 concise sentences for a crypto developer: ${topic}`,
        },
      ],
    });
    const summary =
      message.content[0].type === "text" ? message.content[0].text : getFallbackSummary(topic);
    return { service: "AI Summarizer", topic, summary };
  } catch {
    return { service: "AI Summarizer", topic, summary: getFallbackSummary(topic) };
  }
}
