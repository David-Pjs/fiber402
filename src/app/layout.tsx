import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fiber-402 — AI Agent Payment Layer",
  description: "The x402 payment protocol for CKB Fiber Network.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
