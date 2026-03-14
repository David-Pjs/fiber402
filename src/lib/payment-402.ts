/**
 * payment-402.ts
 * Core 402 Payment Required middleware logic.
 * Used by all marketplace service routes.
 */

import { NextRequest, NextResponse } from "next/server";
import { newInvoice, verifyPayment } from "@/lib/fiber";

export interface PaymentRequirement {
  serviceId: string;
  amount: number;
  description: string;
}

/**
 * Check if request includes a valid payment header.
 * Returns the invoice string if present, null otherwise.
 */
export function getPaymentHeader(req: NextRequest): string | null {
  return req.headers.get("x-fiber-payment");
}

/**
 * Issue a 402 response with a Fiber invoice.
 * The agent client reads this and pays automatically.
 */
export async function require402(req: PaymentRequirement): Promise<NextResponse> {
  const invoice = await newInvoice(req.amount);
  return NextResponse.json(
    {
      error: "Payment Required",
      payment: {
        serviceId: req.serviceId,
        amount: req.amount,
        asset: "CKB",
        network: "Fiber",
        invoice: invoice.invoice,
        paymentHash: invoice.paymentHash,
        description: req.description,
        expiry: invoice.expiry,
      },
    },
    {
      status: 402,
      headers: {
        "X-Payment-Required": "true",
        "X-Payment-Amount": String(req.amount),
        "X-Payment-Asset": "CKB",
        "X-Payment-Network": "Fiber",
        "X-Payment-Invoice": invoice.invoice,
      },
    }
  );
}

/**
 * Verify a payment header before serving data.
 */
export async function verifyPaymentHeader(
  req: NextRequest
): Promise<{ valid: boolean; invoice: string | null }> {
  const invoice = getPaymentHeader(req);
  if (!invoice) return { valid: false, invoice: null };
  const valid = await verifyPayment(invoice);
  return { valid, invoice };
}
