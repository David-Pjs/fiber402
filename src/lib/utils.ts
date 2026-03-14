import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCKB(amount: number): string {
  return amount.toFixed(3) + " CKB";
}

export function shortHash(hash: string): string {
  return hash.slice(0, 6) + "..." + hash.slice(-4);
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
