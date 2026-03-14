import { NextResponse } from "next/server";
import { getBalance } from "@/lib/fiber";

export async function GET() {
  const balance = await getBalance();
  return NextResponse.json({ balance });
}
