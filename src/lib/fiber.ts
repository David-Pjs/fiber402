/**
 * fiber.ts
 *
 * Real Fiber Node RPC implementation.
 * Set FIBER_NODE_RPC_URL env var to your node (default: http://127.0.0.1:8227).
 * Falls back to mock if node is unreachable.
 *
 * CKB amounts: 1 CKB = 100_000_000 shannons
 */

export interface FiberInvoice {
  invoice: string;
  amount: number;
  asset: "CKB";
  expiry: number;
  paymentHash: string;
}

export interface PaymentResult {
  success: boolean;
  txHash: string;
  amount: number;
  timestamp: number;
}

const FIBER_RPC = process.env.FIBER_NODE_RPC_URL || "http://127.0.0.1:8227";
const CKB_SHANNONS = BigInt(100_000_000);

// ─── JSON-RPC helper ──────────────────────────────────────────────────────────

let _rpcId = 1;

async function rpc<T>(method: string, params: unknown[] = []): Promise<T> {
  const res = await fetch(FIBER_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: _rpcId++, jsonrpc: "2.0", method, params }),
    signal: AbortSignal.timeout(5_000),
  });
  const json = await res.json();
  if (json.error) throw new Error(`Fiber RPC error (${method}): ${JSON.stringify(json.error)}`);
  return json.result as T;
}

// ─── Mock fallback (used when node is unreachable) ────────────────────────────

let mockBalance = 10.0;
const paidInvoices = new Set<string>();

function mockInvoice(amount: number): FiberInvoice {
  const paymentHash = "0x" + Math.random().toString(16).slice(2).padStart(64, "0");
  return {
    invoice: `lnckb1_mock_${paymentHash.slice(2, 20)}`,
    amount,
    asset: "CKB",
    expiry: Date.now() + 60_000,
    paymentHash,
  };
}

async function mockSend(invoice: string, amount: number): Promise<PaymentResult> {
  await new Promise((r) => setTimeout(r, 600));
  mockBalance = parseFloat((mockBalance - amount).toFixed(6));
  const txHash = "0x" + Math.random().toString(16).slice(2).padStart(64, "0");
  paidInvoices.add(invoice);
  return { success: true, txHash, amount, timestamp: Date.now() };
}

// ─── Real RPC types ───────────────────────────────────────────────────────────

interface RpcInvoiceResult {
  invoice_address: string;
  invoice: {
    payment_hash: string;
    data?: {
      timestamp?: string;
      expiry?: string;
    };
  };
}

interface RpcPaymentResult {
  payment_hash: string;
  status: string; // "Success" | "Inflight" | "Failed"
  failed_error?: string;
}

interface RpcChannel {
  channel_id: string;
  local_balance: string; // shannons as hex string
  status: string;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getBalance(): Promise<number> {
  try {
    const result = await rpc<{ channels: RpcChannel[] }>("list_channels", [{}]);
    const channels = result?.channels ?? [];
    const totalShannons = channels
      .filter((c) => c.status === "Open")
      .reduce((sum, c) => sum + BigInt(c.local_balance), BigInt(0));
    return Number(totalShannons) / Number(CKB_SHANNONS);
  } catch {
    return mockBalance;
  }
}

export async function newInvoice(amount: number): Promise<FiberInvoice> {
  try {
    const shannons = BigInt(Math.round(amount * Number(CKB_SHANNONS)));
    const result = await rpc<RpcInvoiceResult>("new_invoice", [
      {
        amount: `0x${shannons.toString(16)}`,
        currency: process.env.FIBER_CURRENCY || "Fibt", // Fibt = testnet, Fibb = mainnet
        description: "Fiber 402 marketplace payment",
        expiry: "0xe10", // 3600 seconds
        final_cltv: "0x28", // 40 blocks
      },
    ]);
    const expirySeconds = result.invoice?.data?.expiry
      ? parseInt(result.invoice.data.expiry, 16)
      : 3600;
    return {
      invoice: result.invoice_address,
      amount,
      asset: "CKB",
      expiry: Date.now() + expirySeconds * 1000,
      paymentHash: result.invoice.payment_hash,
    };
  } catch {
    return mockInvoice(amount);
  }
}

export async function sendPayment(invoice: string, amount: number): Promise<PaymentResult> {
  // Mock invoices stay in mock land
  if (invoice.startsWith("lnckb1_mock_")) {
    return mockSend(invoice, amount);
  }
  try {
    const result = await rpc<RpcPaymentResult>("send_payment", [{ invoice }]);
    const paymentHash = result.payment_hash;

    // Poll until settled (max 30s)
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1_000));
      const status = await rpc<RpcPaymentResult>("get_payment", [{ payment_hash: paymentHash }]);
      if (status.status === "Success") {
        return { success: true, txHash: paymentHash, amount, timestamp: Date.now() };
      }
      if (status.status === "Failed") {
        throw new Error(`Payment failed: ${status.failed_error ?? "unknown reason"}`);
      }
    }
    throw new Error("Payment timed out after 30s");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("fetch") || msg.includes("ECONNREFUSED") || msg.includes("timeout")) {
      return mockSend(invoice, amount);
    }
    throw err;
  }
}

// ─── Network Graph ────────────────────────────────────────────────────────────

export interface GraphNode {
  node_id: string;
  alias?: string;
  addresses: string[];
  timestamp: number;
}

export interface GraphChannel {
  channel_id: string;
  node1: string;
  node2: string;
  capacity_ckb: number;
  last_updated: number;
}

export interface NetworkGraph {
  nodes: GraphNode[];
  channels: GraphChannel[];
  total_capacity_ckb: number;
  is_mock: boolean;
}

interface RpcGraphNode {
  node_id: string;
  alias?: string;
  addresses?: string[];
  timestamp?: string | number;
}

interface RpcGraphChannel {
  channel_outpoint: string;
  node1?: string;
  node2?: string;
  node1_to_node2?: { capacity?: string };
  capacity?: string;
  update_time?: string | number;
}

function mockGraph(): NetworkGraph {
  const nodeIds = Array.from({ length: 8 }, (_, i) =>
    "0x" + (i + 1).toString().padStart(66, "0")
  );
  const channels: GraphChannel[] = [
    { channel_id: "0xch01", node1: nodeIds[0], node2: nodeIds[1], capacity_ckb: 5000, last_updated: Date.now() },
    { channel_id: "0xch02", node1: nodeIds[0], node2: nodeIds[2], capacity_ckb: 3200, last_updated: Date.now() },
    { channel_id: "0xch03", node1: nodeIds[1], node2: nodeIds[3], capacity_ckb: 8100, last_updated: Date.now() },
    { channel_id: "0xch04", node1: nodeIds[2], node2: nodeIds[4], capacity_ckb: 2400, last_updated: Date.now() },
    { channel_id: "0xch05", node1: nodeIds[3], node2: nodeIds[5], capacity_ckb: 6700, last_updated: Date.now() },
    { channel_id: "0xch06", node1: nodeIds[4], node2: nodeIds[6], capacity_ckb: 1900, last_updated: Date.now() },
    { channel_id: "0xch07", node1: nodeIds[5], node2: nodeIds[7], capacity_ckb: 4300, last_updated: Date.now() },
    { channel_id: "0xch08", node1: nodeIds[1], node2: nodeIds[6], capacity_ckb: 3600, last_updated: Date.now() },
  ];
  return {
    nodes: nodeIds.map((id, i) => ({ node_id: id, alias: `fiber-node-${i + 1}`, addresses: [], timestamp: Date.now() })),
    channels,
    total_capacity_ckb: channels.reduce((s, c) => s + c.capacity_ckb, 0),
    is_mock: true,
  };
}

export async function getNetworkGraph(): Promise<NetworkGraph> {
  try {
    const [nodesResult, channelsResult] = await Promise.all([
      rpc<{ nodes: RpcGraphNode[] }>("graph_nodes", [{}]),
      rpc<{ channels: RpcGraphChannel[] }>("graph_channels", [{}]),
    ]);

    const nodes: GraphNode[] = (nodesResult?.nodes ?? []).map((n) => ({
      node_id: n.node_id,
      alias: n.alias,
      addresses: n.addresses ?? [],
      timestamp: typeof n.timestamp === "string" ? parseInt(n.timestamp, 16) : (n.timestamp ?? 0),
    }));

    const channels: GraphChannel[] = (channelsResult?.channels ?? []).map((c) => {
      const rawCapacity = c.node1_to_node2?.capacity ?? c.capacity ?? "0x0";
      const capacityShannons = BigInt(rawCapacity);
      return {
        channel_id: c.channel_outpoint,
        node1: c.node1 ?? "",
        node2: c.node2 ?? "",
        capacity_ckb: Number(capacityShannons) / Number(CKB_SHANNONS),
        last_updated: typeof c.update_time === "string" ? parseInt(c.update_time, 16) : (c.update_time ?? 0),
      };
    });

    const total_capacity_ckb = channels.reduce((s, c) => s + c.capacity_ckb, 0);
    return { nodes, channels, total_capacity_ckb, is_mock: false };
  } catch {
    return mockGraph();
  }
}

// ─── Node / Peer management ───────────────────────────────────────────────────

export interface NodeInfo {
  node_id: string;
  alias?: string;
  addresses: string[];
  num_peers: number;
  num_channels: number;
  is_mock: boolean;
}

export interface PeerInfo {
  node_id: string;
  addresses: string[];
  connected: boolean;
}

export async function getNodeInfo(): Promise<NodeInfo> {
  try {
    const info = await rpc<{
      node_id: string;
      alias?: string;
      addresses?: string[];
      num_peers?: number;
      num_channels?: number;
    }>("node_info", []);
    return {
      node_id: info.node_id,
      alias: info.alias,
      addresses: info.addresses ?? [],
      num_peers: info.num_peers ?? 0,
      num_channels: info.num_channels ?? 0,
      is_mock: false,
    };
  } catch {
    return {
      node_id: "mock-node",
      alias: "fiber-402-mock",
      addresses: [],
      num_peers: 0,
      num_channels: 0,
      is_mock: true,
    };
  }
}

export async function listPeers(): Promise<PeerInfo[]> {
  try {
    const result = await rpc<{ peers: Array<{ node_id: string; addresses?: string[]; connected?: boolean }> }>(
      "list_peers",
      [{}]
    );
    return (result?.peers ?? []).map((p) => ({
      node_id: p.node_id,
      addresses: p.addresses ?? [],
      connected: p.connected ?? true,
    }));
  } catch {
    return [];
  }
}

export async function connectPeer(address: string): Promise<{ success: boolean; error?: string }> {
  try {
    await rpc("connect_peer", [{ address }]);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function openChannel(params: {
  peer_id: string;
  funding_amount: string; // hex shannons
}): Promise<{ success: boolean; channel_id?: string; error?: string }> {
  try {
    const result = await rpc<{ channel_id: string }>("open_channel", [params]);
    return { success: true, channel_id: result.channel_id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function verifyPayment(invoice: string): Promise<boolean> {
  if (invoice.startsWith("lnckb1_mock_") || paidInvoices.has(invoice)) return true;
  try {
    const decoded = await rpc<{ payment_hash: string }>("parse_invoice", [{ invoice }]);
    const status = await rpc<RpcPaymentResult>("get_payment", [
      { payment_hash: decoded.payment_hash },
    ]);
    return status.status === "Success";
  } catch {
    return false;
  }
}
