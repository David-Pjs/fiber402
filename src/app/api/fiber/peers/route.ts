import { NextRequest, NextResponse } from "next/server";
import { listPeers, connectPeer } from "@/lib/fiber";

// GET /api/fiber/peers — list connected peers
export async function GET() {
  const peers = await listPeers();
  return NextResponse.json({ peers });
}

// POST /api/fiber/peers — connect to a peer
// Body: { address: "/ip4/1.2.3.4/tcp/8228/p2p/QmXxx..." }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const address: string | undefined = body?.address;

  if (!address || typeof address !== "string") {
    return NextResponse.json({ error: "address is required (multiaddr string)" }, { status: 400 });
  }

  const result = await connectPeer(address);

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "connect failed" }, { status: 502 });
  }

  return NextResponse.json({ success: true, connected_to: address });
}
