import { NextResponse } from "next/server";
import { getNetworkGraph } from "@/lib/fiber";

export async function GET() {
  const graph = await getNetworkGraph();
  return NextResponse.json(graph);
}
