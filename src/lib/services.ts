export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  endpoint: string;
  exampleQuery: string;
}

export const SERVICES: Service[] = [
  {
    id: "ckb-oracle",
    name: "CKB Oracle",
    description: "Real-time CKB price & market data",
    price: 0.001,
    endpoint: "/api/marketplace/ckb-oracle",
    exampleQuery: "What is the current CKB price?",
  },
  {
    id: "ai-summarizer",
    name: "AI Summarizer",
    description: "Claude summarizes any topic",
    price: 0.01,
    endpoint: "/api/marketplace/ai-summarizer",
    exampleQuery: "Summarize the Nervos CKB ecosystem",
  },
  {
    id: "chain-analytics",
    name: "Chain Analytics",
    description: "On-chain stats for CKB network",
    price: 0.005,
    endpoint: "/api/marketplace/chain-analytics",
    exampleQuery: "Show me top CKB network stats",
  },
  {
    id: "fiber-stats",
    name: "Fiber Stats",
    description: "Live Fiber Network channel data",
    price: 0.002,
    endpoint: "/api/marketplace/fiber-stats",
    exampleQuery: "What is the state of Fiber Network?",
  },
];
