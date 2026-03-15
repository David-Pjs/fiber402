import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { sendPayment } from "@/lib/fiber";
import { SERVICES } from "@/lib/services";

export const maxDuration = 120;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
  timeout: 60_000,
  maxRetries: 0, // handle retries ourselves
});

const MODEL = process.env.AI_MODEL || "claude-haiku-4-5-20251001";

function send(controller: ReadableStreamDefaultController, data: object) {
  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
}

const tools: Anthropic.Tool[] = [
  {
    name: "fetch_service",
    description: "Fetch data from a marketplace service. Fiber micropayment is handled automatically if a 402 is returned.",
    input_schema: {
      type: "object" as const,
      properties: {
        service_id: { type: "string", enum: SERVICES.map((s) => s.id), description: "The service to call" },
        topic: { type: "string", description: "For ai-summarizer only: the topic to summarize" },
      },
      required: ["service_id"],
    },
  },
  {
    name: "list_services",
    description: "List all available marketplace services and their prices.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
];

async function callService(
  serviceId: string,
  topic?: string,
  controller?: ReadableStreamDefaultController
): Promise<string> {
  const svc = SERVICES.find((s) => s.id === serviceId);
  if (!svc) return JSON.stringify({ error: "Service not found" });

  const baseUrl = process.env.INTERNAL_BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || process.env.NEXT_PUBLIC_BASE_URL
    || "http://127.0.0.1:3000";
  const url = `${baseUrl}${svc.endpoint}`;
  const method = serviceId === "ai-summarizer" ? "POST" : "GET";
  const bodyData = serviceId === "ai-summarizer" && topic ? { topic } : undefined;

  const firstRes = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: bodyData ? JSON.stringify(bodyData) : undefined,
  });

  if (firstRes.status === 402) {
    const info = await firstRes.json();
    const invoice = info.payment.invoice;
    if (controller) send(controller, { type: "paying", serviceId });
    const result = await sendPayment(invoice, svc.price);
    if (controller) send(controller, { type: "paid", serviceId, txHash: result.txHash });
    const secondRes = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", "x-fiber-payment": invoice },
      body: bodyData ? JSON.stringify(bodyData) : undefined,
    });
    return JSON.stringify(await secondRes.json());
  }

  return JSON.stringify(await firstRes.json());
}

// Fallback: when AI is unavailable, use services directly and summarize locally
async function fallbackRun(
  task: string,
  controller: ReadableStreamDefaultController
) {
  send(controller, { type: "thinking", content: "AI temporarily unavailable - running in direct mode..." });

  const lower = task.toLowerCase();
  const toCall: string[] = [];
  if (lower.includes("price") || lower.includes("ckb") || lower.includes("market")) toCall.push("ckb-oracle");
  if (lower.includes("fiber") || lower.includes("channel") || lower.includes("network")) toCall.push("fiber-stats");
  if (lower.includes("chain") || lower.includes("analytics") || lower.includes("stats")) toCall.push("chain-analytics");
  if (lower.includes("summar") || lower.includes("ecosystem") || lower.includes("nervos")) toCall.push("ai-summarizer");
  if (toCall.length === 0) toCall.push("ckb-oracle", "fiber-stats");

  const results: Record<string, unknown> = {};
  for (const id of toCall) {
    const svc = SERVICES.find((s) => s.id === id)!;
    send(controller, { type: "thinking", content: `Accessing ${svc.name}...` });
    const data = await callService(id, "Nervos CKB ecosystem", controller);
    results[id] = JSON.parse(data);
  }

  const lines: string[] = [`Here's what I found for: "${task}"\n`];
  for (const [id, data] of Object.entries(results)) {
    const svc = SERVICES.find((s) => s.id === id)!;
    lines.push(`**${svc.name}**`);
    const d = (data as { data?: Record<string, unknown> }).data ?? data;
    for (const [k, v] of Object.entries(d as Record<string, unknown>).slice(0, 6)) {
      lines.push(`• ${k.replace(/_/g, " ")}: ${v}`);
    }
    lines.push("");
  }
  lines.push("_Payments made via CKB Fiber Network micropayments._");
  send(controller, { type: "result", content: lines.join("\n") });
}

export async function POST(req: NextRequest) {
  const { task } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        send(controller, { type: "thinking", content: "Planning which services to use..." });

        // Try AI first
        try {
          const messages: Anthropic.MessageParam[] = [
            {
              role: "user",
              content: `You are a helpful AI agent with access to a CKB blockchain data marketplace. Each service costs a small CKB micropayment via Fiber Network, handled automatically when you call fetch_service.

Complete this task using the available services:
${task}

Use multiple services if relevant. Provide a clear, well-formatted response.`,
            },
          ];

          let continueLoop = true;

          while (continueLoop) {
            const response = await client.messages.create({ model: MODEL, max_tokens: 1024, tools, messages });

            if (response.stop_reason === "tool_use") {
              messages.push({ role: "assistant", content: response.content });
              const toolResults: Anthropic.ToolResultBlockParam[] = [];

              for (const block of response.content) {
                if (block.type !== "tool_use") continue;
                const input = block.input as { service_id?: string; topic?: string };
                let result = "";

                if (block.name === "list_services") {
                  send(controller, { type: "thinking", content: "Scanning available services..." });
                  result = SERVICES.map((s) => `${s.id} (${s.price} CKB): ${s.description}`).join("\n");
                } else if (block.name === "fetch_service" && input.service_id) {
                  const svc = SERVICES.find((s) => s.id === input.service_id);
                  if (svc) send(controller, { type: "thinking", content: `Accessing ${svc.name}...` });
                  result = await callService(input.service_id, input.topic, controller);
                }

                toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
              }
              messages.push({ role: "user", content: toolResults });
            } else {
              continueLoop = false;
              const text = response.content
                .filter((b) => b.type === "text")
                .map((b) => (b as Anthropic.TextBlock).text)
                .join("");
              send(controller, { type: "result", content: text });
            }
          }
        } catch (aiError) {
          // AI unavailable - run fallback for any connectivity/overload issue
          const msg = aiError instanceof Error ? aiError.message : "";
          const status = aiError instanceof Error && "status" in aiError ? (aiError as { status?: number }).status : 0;
          const isUnavailable =
            msg.includes("503") || msg.includes("529") || msg.includes("overloaded") ||
            msg.includes("unavailable") || msg.includes("timeout") || msg.includes("timed out") ||
            msg.includes("fetch") || msg.includes("ECONNREFUSED") || msg.includes("network") ||
            msg.includes("connect") || msg.includes("502") || msg.includes("504") ||
            status === 529 || status === 503 || status === 502 || status === 504;
          if (isUnavailable) {
            await fallbackRun(task, controller);
          } else {
            throw aiError;
          }
        }
      } catch (e) {
        send(controller, { type: "error", content: e instanceof Error ? e.message : "Unknown error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
