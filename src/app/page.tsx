"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sun, Moon, Zap, TrendingUp, Bot, BarChart2, Radio,
  CircleDot, CheckCircle2, Loader2, ArrowUpRight, SendHorizonal,
  Wallet, Activity, Menu, X, ReceiptText, Play, Square, Cpu, RefreshCw,
  Globe, Network, Lock,
} from "lucide-react";
import { SERVICES } from "@/lib/services";
import { formatCKB, shortHash } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

/* ─── Session wallet helpers ─── */
function genSessionId(): string {
  return Array.from({length:16}, ()=>"abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random()*36)]).join('');
}
function sessionToAddr(id: string): string {
  return `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa${id.slice(0,8)}`;
}
function shortAddr(addr: string): string {
  return addr.slice(0,10) + '...' + addr.slice(-6);
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  "ckb-oracle":      <TrendingUp size={14} />,
  "ai-summarizer":   <Bot size={14} />,
  "chain-analytics": <BarChart2 size={14} />,
  "fiber-stats":     <Radio size={14} />,
};

const AUTOPILOT_TASKS = [
  "Get the CKB price, chain analytics, and Fiber Network stats - give me a complete ecosystem health report across all data sources",
  "Check on-chain activity: transactions, active addresses, hash rate. Then summarize what it means for the CKB network right now",
  "Pull the Fiber Network capacity and node count, then combine with the live CKB price for a full market + infrastructure brief",
  "Run all available services and give me an investor-grade summary of the CKB blockchain ecosystem today",
];

interface Payment { id:string; serviceId:string; serviceName:string; amount:number; txHash:string; ts:number; fresh:boolean; }
interface Msg      { id:string; role:"user"|"agent"|"status"; text:string; }

const EXAMPLES = [
  "What is CKB trading at right now? Include market cap and 24h volume",
  "Give me a full network health report - price, chain metrics, and Fiber capacity",
  "How active is the CKB blockchain today? Show on-chain transactions and analytics",
];

/* ─── Payment Toast ─── */
function PaymentToast({ toast }: { toast:{ serviceName:string; amount:number; txHash:string }|null }) {
  if (!toast) return null;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
      <div style={{ animation:"toastPop 2.4s ease-out forwards" }}>
        <div style={{ background:"var(--green)", borderRadius:24, padding:"24px 40px", textAlign:"center", boxShadow:"0 0 80px rgba(34,197,94,0.5), 0 0 160px rgba(34,197,94,0.2)", minWidth:280 }}>
          <div style={{ width:48, height:48, borderRadius:16, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
            <Zap size={24} color="#fff" fill="#fff" />
          </div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.15em", color:"rgba(255,255,255,0.7)", marginBottom:6, textTransform:"uppercase" }}>Payment Sent</div>
          <div style={{ fontSize:32, fontWeight:800, color:"#fff", fontFamily:"monospace", letterSpacing:"-0.02em", marginBottom:8 }}>-{toast.amount} CKB</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)", marginBottom:8, fontWeight:500 }}>{toast.serviceName}</div>
          <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(0,0,0,0.2)", borderRadius:6, padding:"3px 8px" }}>
            <CheckCircle2 size={10} color="rgba(255,255,255,0.6)" />
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.6)", fontFamily:"monospace" }}>{toast.txHash.slice(0,20)}…</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar ─── */
function Sidebar({ activeId, payStep }: { activeId:string|null; payStep:number }) {
  const STEPS = ["Agent requests resource","Server returns HTTP 402","Agent pays via Fiber","Resource unlocked instantly"];
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"14px 0", overflowY:"auto" }}>
      <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--subtle)", padding:"0 16px 10px" }}>Services</p>
      <div style={{ display:"flex", flexDirection:"column", gap:2, padding:"0 8px" }}>
        {SERVICES.map(svc => {
          const active = activeId===svc.id;
          return (
            <div key={svc.id} style={{ display:"flex", alignItems:"center", gap:10, borderRadius:10, padding:"8px 10px", transition:"all 0.15s", background:active?"var(--green-dim)":"transparent", border:`1px solid ${active?"var(--green)":"transparent"}` }}>
              <div style={{ width:28, height:28, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, background:active?"var(--green-dim)":"var(--surface-2)", border:`1px solid ${active?"var(--green-ring)":"var(--border)"}`, color:active?"var(--green)":"var(--muted)", transition:"all 0.2s" }}>
                {SERVICE_ICONS[svc.id]}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:4 }}>
                  <span style={{ fontSize:12, fontWeight:500, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{svc.name}</span>
                  <span style={{ fontSize:10, fontFamily:"monospace", color:active?"var(--green)":"var(--muted)", flexShrink:0 }}>{svc.price} CKB</span>
                </div>
                <p style={{ fontSize:11, color:"var(--muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginTop:1 }}>{svc.description}</p>
              </div>
              {active && <Loader2 size={11} className="anim-spin" style={{ color:"var(--green)", flexShrink:0 }} />}
            </div>
          );
        })}
      </div>

      {/* x402 protocol stepper */}
      <div style={{ marginTop:"auto", padding:"14px 12px 0" }}>
        <div style={{ borderRadius:12, padding:12, background:"var(--surface-2)", border:"1px solid var(--border)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
            <div style={{ width:16, height:16, borderRadius:4, background:"var(--green-dim)", border:"1px solid var(--green-ring)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Activity size={9} style={{ color:"var(--green)" }} />
            </div>
            <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--subtle)" }}>x402 Protocol</span>
          </div>
          {STEPS.map((step, i) => {
            const done   = payStep > i + 1;
            const active = payStep === i + 1;
            return (
              <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                  <div style={{ width:20, height:20, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, background: done?"var(--green)": active?"var(--green-dim)":"transparent", border: active||done?"1px solid var(--green)":"1px solid var(--border)", transition:"all 0.3s", boxShadow: active?"0 0 10px var(--green-ring)":"none" }}>
                    {done
                      ? <CheckCircle2 size={11} style={{ color:"#fff" }} />
                      : <span style={{ fontSize:9, fontFamily:"monospace", color:active?"var(--green)":"var(--subtle)", fontWeight:700 }}>{i+1}</span>
                    }
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ width:1, height:12, background:done?"var(--green)":"var(--border)", transition:"background 0.4s", margin:"3px 0" }} />
                  )}
                </div>
                <div style={{ flex:1, paddingBottom: i < STEPS.length-1 ? 6 : 0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, paddingTop:2 }}>
                    <span style={{ fontSize:11, lineHeight:1.4, transition:"color 0.3s", color:done?"var(--text)": active?"var(--green)":"var(--muted)", fontWeight:active?600:400 }}>{step}</span>
                    {active && <Loader2 size={9} className="anim-spin" style={{ color:"var(--green)", flexShrink:0 }} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Feed ─── */
function Feed({ payments, spent, balance }: { payments:Payment[]; spent:number; balance:number }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <Activity size={13} style={{ color:"var(--muted)" }} />
          <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--subtle)" }}>Live Payments</span>
        </div>
        {payments.length > 0 && <Badge variant="green">{payments.length} tx</Badge>}
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:10, display:"flex", flexDirection:"column", gap:6 }}>
        {payments.length === 0 ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, padding:"40px 0" }}>
            <CircleDot size={24} style={{ color:"var(--border-hi)" }} />
            <span style={{ fontSize:12, color:"var(--subtle)" }}>No payments yet</span>
          </div>
        ) : (
          payments.map(p => (
            <div key={p.id} className={p.fresh?"anim-flash anim-in":"anim-in"} style={{ borderRadius:10, padding:"10px 12px", transition:"border-color 0.6s, background 0.6s", background:p.fresh?"var(--green-dim)":"var(--surface-2)", border:`1px solid ${p.fresh?"var(--green)":"var(--border)"}`, boxShadow:p.fresh?"0 0 0 1px var(--green-ring)":"none" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <div style={{ width:22, height:22, borderRadius:6, background:p.fresh?"var(--green-dim)":"var(--surface)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", color:p.fresh?"var(--green)":"var(--muted)" }}>
                    {SERVICE_ICONS[p.serviceId] ?? <Zap size={11} />}
                  </div>
                  <span style={{ fontSize:12, fontWeight:500, color:"var(--text)" }}>{p.serviceName}</span>
                </div>
                <span style={{ fontSize:11, fontFamily:"monospace", fontWeight:700, color:"var(--green)" }}>-{p.amount} CKB</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:10, fontFamily:"monospace", color:"var(--muted)" }}>{shortHash(p.txHash)}</span>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <CheckCircle2 size={10} style={{ color:p.fresh?"var(--green)":"var(--subtle)" }} />
                  <span style={{ fontSize:10, color:"var(--subtle)" }}>{new Date(p.ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {payments.length > 0 && (
        <div style={{ padding:"10px 14px", borderTop:"1px solid var(--border)", flexShrink:0 }}>
          {[
            { label:"Transactions", value:String(payments.length), green:false },
            { label:"Total spent",  value:formatCKB(spent),        green:true  },
            { label:"Remaining",    value:formatCKB(balance),      green:false },
          ].map(r => (
            <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"3px 0" }}>
              <span style={{ fontSize:11, color:"var(--muted)" }}>{r.label}</span>
              <span style={{ fontSize:11, fontFamily:"monospace", fontWeight:600, color:r.green?"var(--green)":"var(--text)" }}>{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Simple markdown renderer ─── */
function renderMd(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={j} style={{ color:"var(--text)", fontWeight:700 }}>{p.slice(2,-2)}</strong>
        : p
    );
    const rendered = parts.map((p, j) => {
      if (typeof p !== "string") return p;
      const subs = p.split(/(_[^_]+_)/g).map((s, k) =>
        s.startsWith("_") && s.endsWith("_")
          ? <em key={k} style={{ color:"var(--muted)", fontStyle:"italic" }}>{s.slice(1,-1)}</em>
          : s
      );
      return <span key={j}>{subs}</span>;
    });
    return <span key={i}>{rendered}{i < text.split("\n").length-1 ? "\n" : ""}</span>;
  });
}

/* ─── Message item ─── */
function MsgItem({ m, running }: { m:Msg; running:boolean }) {
  return (
    <div className="anim-up">
      {m.role==="user" && (
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <div style={{ maxWidth:"75%", background:"var(--green)", color:"#fff", borderRadius:"16px 16px 4px 16px", padding:"10px 14px", fontSize:13, lineHeight:1.5, fontWeight:500 }}>{m.text}</div>
        </div>
      )}
      {m.role==="agent" && (
        <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
          <div style={{ width:26, height:26, borderRadius:8, flexShrink:0, marginTop:2, background:"var(--green-dim)", border:"1px solid var(--green-ring)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Bot size={13} style={{ color:"var(--green)" }} />
          </div>
          <div style={{ maxWidth:"80%", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"4px 16px 16px 16px", padding:"10px 14px", fontSize:13, lineHeight:1.6, color:"var(--text)", whiteSpace:"pre-wrap", boxShadow:"var(--shadow)" }}>{renderMd(m.text)}</div>
        </div>
      )}
      {m.role==="status" && (
        <div style={{ display:"flex", justifyContent:"center" }}>
          <span style={{ fontSize:11, padding:"4px 12px", borderRadius:99, background:"var(--surface-2)", border:"1px solid var(--border)", color:"var(--muted)", display:"flex", alignItems:"center", gap:6 }}>
            {running && <Loader2 size={10} className="anim-spin" style={{ color:"var(--green)" }} />}
            {m.text}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Main ─── */
export default function Home() {
  const [theme, setTheme]         = useState<"dark"|"light">("dark");
  const [balance, setBalance]     = useState(10.0);
  const [spent, setSpent]         = useState(0);
  const [payments, setPayments]   = useState<Payment[]>([]);
  const [msgs, setMsgs]           = useState<Msg[]>([]);
  const [input, setInput]         = useState("");
  const [running, setRunning]     = useState(false);
  const [activeId, setActiveId]   = useState<string|null>(null);
  const [sideOpen, setSideOpen]   = useState(false);
  const [feedOpen, setFeedOpen]   = useState(false);
  const [payStep, setPayStep]     = useState(0);
  const [toast, setToast]         = useState<{ serviceName:string; amount:number; txHash:string }|null>(null);
  const [autopilot, setAutopilot] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [autoCount, setAutoCount] = useState(0);
  const [sessionId, setSessionId] = useState("");
  const [walletAddr, setWalletAddr] = useState("");

  const bottomRef      = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const runningRef     = useRef(false);
  const autopilotRef   = useRef(false);
  const autoIdxRef     = useRef(0);
  const pendingRef     = useRef<ReturnType<typeof setTimeout>|null>(null);
  const tickRef        = useRef<ReturnType<typeof setInterval>|null>(null);
  const scheduleRef    = useRef<(()=>void)|undefined>(undefined);

  useEffect(() => {
    const saved = (localStorage.getItem("f402-theme") as "dark"|"light") || "dark";
    setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme==="light");
    localStorage.setItem("f402-theme", theme);
  }, [theme]);

  useEffect(() => {
    // Session wallet: each visitor gets their own isolated wallet
    let id = localStorage.getItem("f402-session");
    if (!id) {
      id = genSessionId();
      localStorage.setItem("f402-session", id);
    }
    setSessionId(id);
    setWalletAddr(sessionToAddr(id));
    // Load persisted balance for this session
    const saved = localStorage.getItem(`f402-bal-${id}`);
    if (saved !== null) setBalance(parseFloat(saved));
  }, []);

  // Persist balance changes per session
  useEffect(() => {
    if (sessionId) localStorage.setItem(`f402-bal-${sessionId}`, String(balance));
  }, [balance, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [msgs]);

  const pushMsg = useCallback((role: Msg["role"], text: string) => {
    setMsgs(p => [...p, { id:Math.random().toString(36).slice(2), role, text }]);
  }, []);

  const pushPayment = useCallback((svc: typeof SERVICES[0], txHash: string) => {
    const p: Payment = { id:Math.random().toString(36).slice(2), serviceId:svc.id, serviceName:svc.name, amount:svc.price, txHash, ts:Date.now(), fresh:true };
    setPayments(prev => [p, ...prev].slice(0, 30));
    setBalance(b => parseFloat((b - svc.price).toFixed(6)));
    setSpent(s => parseFloat((s + svc.price).toFixed(6)));
    setTimeout(() => setPayments(prev => prev.map(x => x.id===p.id ? {...x, fresh:false} : x)), 2000);
  }, []);

  const runTask = useCallback(async (task: string) => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true); setSideOpen(false); setFeedOpen(false);
    pushMsg("user", task);
    pushMsg("status", "Connecting to marketplace…");
    try {
      const res = await fetch("/api/agent/run", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ task }) });
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.error||`HTTP ${res.status}`); }
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const d = JSON.parse(line.slice(6));
            if (d.type==="thinking") {
              pushMsg("status", d.content);
            } else if (d.type==="paying") {
              const s = SERVICES.find(x => x.id===d.serviceId);
              setActiveId(d.serviceId);
              setPayStep(1);
              setTimeout(() => setPayStep(2), 350);
              setTimeout(() => setPayStep(3), 750);
              if (s) pushMsg("status", `Paying ${formatCKB(s.price)} → ${s.name}`);
            } else if (d.type==="paid") {
              const s = SERVICES.find(x => x.id===d.serviceId);
              setPayStep(4);
              if (s) {
                pushPayment(s, d.txHash);
                setToast({ serviceName:s.name, amount:s.price, txHash:d.txHash });
                setTimeout(() => setToast(null), 2400);
              }
              setTimeout(() => { setActiveId(null); setPayStep(0); }, 1200);
              pushMsg("status", `Confirmed · ${shortHash(d.txHash)}`);
            } else if (d.type==="result") {
              pushMsg("agent", d.content);
            } else if (d.type==="error") {
              pushMsg("status", `⚠ ${d.content}`);
            }
          } catch {}
        }
      }
    } catch(e) {
      pushMsg("status", e instanceof Error ? `⚠ ${e.message}` : "Something went wrong");
    } finally {
      runningRef.current = false;
      setRunning(false); setActiveId(null);
      inputRef.current?.focus();
      if (autopilotRef.current) scheduleRef.current?.();
    }
  }, [pushMsg, pushPayment]);

  // Schedule next autopilot task after a delay
  const scheduleNext = useCallback(() => {
    const DELAY = 12;
    setCountdown(DELAY);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    if (pendingRef.current) clearTimeout(pendingRef.current);
    pendingRef.current = setTimeout(() => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (!autopilotRef.current) return;
      const task = AUTOPILOT_TASKS[autoIdxRef.current % AUTOPILOT_TASKS.length];
      autoIdxRef.current++;
      setAutoCount(c => c + 1);
      runTask(task);
    }, DELAY * 1000);
  }, [runTask]);

  useEffect(() => { scheduleRef.current = scheduleNext; }, [scheduleNext]);

  const toggleAutopilot = useCallback(() => {
    if (autopilotRef.current) {
      autopilotRef.current = false;
      setAutopilot(false);
      if (pendingRef.current) clearTimeout(pendingRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
      setCountdown(0);
    } else {
      autopilotRef.current = true;
      setAutopilot(true);
      setAutoCount(1);
      autoIdxRef.current = 1;
      runTask(AUTOPILOT_TASKS[0]);
    }
  }, [runTask]);

  const resetWallet = useCallback(() => {
    setBalance(10.0);
    setSpent(0);
    setPayments([]);
    setMsgs([]);
    if (sessionId) localStorage.setItem(`f402-bal-${sessionId}`, "10");
  }, [sessionId]);

  const run = useCallback(() => {
    if (!input.trim() || runningRef.current) return;
    const task = input.trim();
    setInput("");
    runTask(task);
  }, [input, runTask]);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div style={{ height:isMobile?"auto":"100vh", minHeight:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column" }}>
      <style>{`
        @keyframes toastPop {
          0%   { opacity:0; transform:scale(0.6); }
          15%  { opacity:1; transform:scale(1.04); }
          25%  { transform:scale(1); }
          75%  { opacity:1; transform:scale(1); }
          100% { opacity:0; transform:scale(0.96); }
        }
        @keyframes autoPulse {
          0%,100% { box-shadow:0 0 0 0 rgba(34,197,94,0.5); }
          50%     { box-shadow:0 0 0 5px rgba(34,197,94,0); }
        }
        @media (max-width: 600px) {
          .hero-headline { font-size: 22px !important; }
          .hero-pad { padding: 28px 16px 36px !important; }
          .hero-sub { font-size: 12px !important; max-width: 100% !important; }
          .flow-row { padding: 10px 12px !important; }
          .flow-label { font-size: 11px !important; }
          .flow-code { font-size: 10px !important; }
          .example-btn { font-size: 12px !important; padding: 11px 13px !important; }
          .autopilot-btn { padding: 12px 13px !important; }
        }
      `}</style>
      <PaymentToast toast={toast} />

      {/* ── NAV ── */}
      <nav style={{ flexShrink:0, borderBottom:"1px solid var(--border)", background:"var(--surface)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", height:49, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 14px var(--green-ring)", flexShrink:0 }}>
            <Zap size={14} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontSize:14, fontWeight:700, color:"var(--text)", letterSpacing:"-0.01em" }}>Fiber-402</span>
          <Badge variant="default" className="text-[10px] hidden sm:flex">CKB · Fiber Network</Badge>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* Desktop stats */}
          <div className="hidden sm:flex" style={{ alignItems:"center", gap:8, fontFamily:"monospace", fontSize:12 }}>
            {/* Wallet address */}
            {walletAddr && (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:6, background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:8, padding:"3px 10px" }}>
                  <div className="anim-green-pulse" style={{ width:6, height:6, borderRadius:"50%", background:"var(--green)", flexShrink:0 }} />
                  <span style={{ fontSize:10, color:"var(--muted)", letterSpacing:"0.02em" }}>{shortAddr(walletAddr)}</span>
                </div>
                <div style={{ width:1, height:16, background:"var(--border)" }} />
              </>
            )}
            <Wallet size={12} style={{ color:"var(--green)" }} />
            <span style={{ color:"var(--text)", fontWeight:700 }}>{formatCKB(balance)}</span>
            <span style={{ color:"var(--subtle)" }}>·</span>
            <span style={{ color:"var(--muted)" }}>spent</span>
            <span style={{ color:"var(--green)", fontWeight:700 }}>{formatCKB(spent)}</span>
            <div style={{ width:1, height:16, background:"var(--border)" }} />
            <button onClick={resetWallet} title="Reset wallet to 10 CKB" style={{ fontSize:10, color:"var(--subtle)", background:"none", border:"none", cursor:"pointer", padding:"2px 4px", borderRadius:4, transition:"color 0.15s" }} onMouseEnter={e=>(e.currentTarget.style.color="var(--muted)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--subtle)")}>
              reset
            </button>
            <div style={{ width:1, height:16, background:"var(--border)" }} />
          </div>

          {/* Autopilot toggle */}
          <button onClick={toggleAutopilot} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 11px", borderRadius:8, cursor:"pointer", border:autopilot?"1px solid var(--green)":"1px solid var(--border)", background:autopilot?"var(--green-dim)":"var(--surface-2)", color:autopilot?"var(--green)":"var(--muted)", fontSize:11, fontWeight:600, transition:"all 0.2s", animation:autopilot?"autoPulse 2s ease infinite":"none", outline:"none" }}>
            {autopilot
              ? <><Square size={10} fill="currentColor" /><span>Stop{countdown>0?` · ${countdown}s`:""}</span></>
              : <><Play  size={10} fill="currentColor" /><span className="hidden sm:inline">Autopilot</span></>
            }
          </button>

          {/* Mobile balance + reset */}
          <div className="flex sm:hidden" style={{ alignItems:"center", gap:6 }}>
            <span style={{ fontFamily:"monospace", fontSize:12, color:"var(--green)", fontWeight:700 }}>{formatCKB(balance)}</span>
            <button onClick={resetWallet} style={{ fontSize:9, color:"var(--subtle)", background:"none", border:"1px solid var(--border)", borderRadius:4, cursor:"pointer", padding:"2px 5px" }}>refill</button>
          </div>

          {/* Mobile drawers */}
          <div className="flex sm:hidden" style={{ gap:4 }}>
            <Button variant="ghost" size="icon" onClick={()=>{ setFeedOpen(false); setSideOpen(v=>!v); }}>
              {sideOpen ? <X size={15} style={{color:"var(--muted)"}} /> : <Menu size={15} style={{color:"var(--muted)"}} />}
            </Button>
            <Button variant="ghost" size="icon" onClick={()=>{ setSideOpen(false); setFeedOpen(v=>!v); }} style={{ position:"relative" }}>
              <ReceiptText size={15} style={{ color:payments.length>0?"var(--green)":"var(--muted)" }} />
              {payments.length>0 && <span style={{ position:"absolute", top:6, right:6, width:5, height:5, borderRadius:"50%", background:"var(--green)" }} />}
            </Button>
          </div>

          <Button variant="ghost" size="icon" onClick={()=>setTheme(t=>t==="dark"?"light":"dark")}>
            {theme==="dark" ? <Sun size={14} style={{color:"var(--muted)"}} /> : <Moon size={14} style={{color:"var(--muted)"}} />}
          </Button>
        </div>
      </nav>

      {/* ── AUTOPILOT BANNER ── */}
      {autopilot && (
        <div className="anim-slide-up" style={{ flexShrink:0, background:"var(--green-dim)", borderBottom:"1px solid var(--green-ring)", padding:"8px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Cpu size={12} style={{ color:"var(--green)" }} />
            <span style={{ fontSize:11, fontWeight:700, color:"var(--green)", letterSpacing:"0.04em" }}>AUTOPILOT RUNNING</span>
            <span style={{ fontSize:11, color:"var(--muted)" }}>- agent is operating autonomously, spending real CKB on paid services</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <span style={{ fontSize:11, fontFamily:"monospace", color:"var(--subtle)" }}>{autoCount} task{autoCount!==1?"s":""} run</span>
            {!running && countdown > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <RefreshCw size={10} style={{ color:"var(--muted)" }} className="anim-spin" />
                <span style={{ fontSize:11, color:"var(--muted)", fontFamily:"monospace" }}>next in {countdown}s</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MOBILE DRAWERS ── */}
      {sideOpen && (
        <div className="flex sm:hidden anim-slide-up" style={{ background:"var(--surface)", borderBottom:"1px solid var(--border)", maxHeight:"55vh", overflow:"hidden" }}>
          <Sidebar activeId={activeId} payStep={payStep} />
        </div>
      )}
      {feedOpen && (
        <div className="flex sm:hidden anim-slide-up" style={{ background:"var(--surface)", borderBottom:"1px solid var(--border)", maxHeight:"60vh", overflow:"hidden", width:"100%" }}>
          <Feed payments={payments} spent={spent} balance={balance} />
        </div>
      )}

      {/* ── BODY ── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", minHeight:0 }}>

        {/* Left sidebar */}
        <aside className="hidden sm:flex" style={{ width:252, flexShrink:0, borderRight:"1px solid var(--border)", background:"var(--surface)", overflow:"hidden" }}>
          <div style={{ width:"100%", overflowY:"auto" }}>
            <Sidebar activeId={activeId} payStep={payStep} />
          </div>
        </aside>

        {/* Center chat */}
        <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
          <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>
            {msgs.length === 0 ? (
              <div className="hero-pad" style={{ maxWidth:560, margin:"0 auto", width:"100%", padding:"48px 24px 48px" }}>

                {/* ── HERO ── */}
                <div style={{ textAlign:"center", marginBottom:40 }}>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"5px 14px", borderRadius:99, background:"var(--green-dim)", border:"1px solid var(--green-ring)", marginBottom:24 }}>
                    <div className="anim-green-pulse" style={{ width:6, height:6, borderRadius:"50%", background:"var(--green)", flexShrink:0 }} />
                    <span style={{ fontSize:10, fontWeight:700, color:"var(--green)", letterSpacing:"0.1em", textTransform:"uppercase" }}>CKB Fiber Hackathon · Live Demo</span>
                  </div>

                  <h1 className="hero-headline" style={{ fontSize:28, fontWeight:900, color:"var(--text)", lineHeight:1.2, letterSpacing:"-0.04em", marginBottom:14 }}>
                    The internet forgot<br/>
                    <span style={{ color:"var(--green)" }}>to build payments.</span>
                  </h1>

                  <p className="hero-sub" style={{ fontSize:13, color:"var(--muted)", lineHeight:1.8, maxWidth:400, margin:"0 auto 24px" }}>
                    HTTP 402 has existed since 1996. Others tried to implement it - Coinbase x402 on Base, Lightning L402 - but gas fees and settlement speed make sub-cent payments unviable. Fiber-402 is the first implementation where $0.001 AI agent micropayments actually work.
                  </p>

                  <div style={{ display:"inline-block", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:10, padding:"12px 20px", textAlign:"left" }}>
                    <div style={{ fontFamily:"monospace", fontSize:13, marginBottom:4 }}>
                      <span style={{ color:"var(--subtle)" }}>HTTP/1.1 </span>
                      <span style={{ color:"var(--green)", fontWeight:800 }}>402</span>
                      <span style={{ color:"var(--text)", fontWeight:600 }}> Payment Required</span>
                    </div>
                    <div style={{ fontSize:10, color:"var(--subtle)", fontFamily:"monospace" }}>
                      defined 1996 · finally viable · <span style={{ color:"var(--green)", fontWeight:700 }}>on Fiber</span>
                    </div>
                  </div>
                </div>

                {/* ── HOW IT WORKS ── */}
                <div style={{ marginBottom:36 }}>
                  <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--subtle)", textAlign:"center", marginBottom:14 }}>How it works</p>
                  <div style={{ border:"1px solid var(--border)", borderRadius:12, overflow:"hidden" }}>
                    {[
                      { n:"01", label:"Agent requests a resource",          code:"GET /api/market-data",   accent:false },
                      { n:"02", label:"Server responds: payment required",   code:"← 402 + Fiber invoice", accent:true  },
                      { n:"03", label:"Agent pays instantly via Fiber",      code:"sendPayment()  ·  <1s", accent:true  },
                      { n:"04", label:"Resource unlocked - zero humans",     code:"← 200 OK + data",      accent:false },
                    ].map((row, i) => (
                      <div key={i} className="flow-row" style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderBottom:i<3?"1px solid var(--border)":"none", background:row.accent?"rgba(34,197,94,0.04)":"var(--surface-2)" }}>
                        <span style={{ fontSize:9, fontFamily:"monospace", fontWeight:800, color:"var(--border-hi)", width:16, flexShrink:0 }}>{row.n}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div className="flow-label" style={{ fontSize:12, fontWeight:500, color:"var(--text)", marginBottom:2 }}>{row.label}</div>
                          <code className="flow-code" style={{ fontSize:11, fontFamily:"monospace", color:row.accent?"var(--green)":"var(--muted)" }}>{row.code}</code>
                        </div>
                        {row.accent && <div style={{ width:5, height:5, borderRadius:"50%", background:"var(--green)", flexShrink:0, boxShadow:"0 0 6px var(--green)" }} />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── YOUR WALLET CARD ── */}
                {walletAddr && (
                  <div style={{ marginBottom:28, borderRadius:12, border:"1px solid var(--green-ring)", background:"var(--green-dim)", padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:9, background:"rgba(34,197,94,0.15)", border:"1px solid var(--green-ring)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <Wallet size={14} style={{ color:"var(--green)" }} />
                      </div>
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:"var(--green)", marginBottom:3 }}>Your Demo Wallet</div>
                        <div style={{ fontSize:10, fontFamily:"monospace", color:"var(--muted)", letterSpacing:"0.02em" }}>{shortAddr(walletAddr)}</div>
                      </div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:16, fontWeight:800, fontFamily:"monospace", color:"var(--green)", letterSpacing:"-0.02em" }}>{formatCKB(balance)}</div>
                      <button onClick={resetWallet} style={{ fontSize:10, color:"var(--muted)", background:"none", border:"none", cursor:"pointer", padding:0, marginTop:2 }} onMouseEnter={e=>(e.currentTarget.style.color="var(--text)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--muted)")}>
                        refill to 10 CKB
                      </button>
                    </div>
                  </div>
                )}

                {/* ── DIVIDER ── */}
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                  <div style={{ flex:1, height:1, background:"var(--border)" }} />
                  <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--subtle)", whiteSpace:"nowrap" }}>Try it - watch payments fire live</span>
                  <div style={{ flex:1, height:1, background:"var(--border)" }} />
                </div>

                {/* ── EXAMPLES ── */}
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {EXAMPLES.map(e => (
                    <button key={e} onClick={()=>{ setInput(e); setTimeout(()=>{ if(e.trim()) runTask(e); }, 50); }}
                      className="example-btn"
                      style={{ textAlign:"left", fontSize:13, padding:"12px 16px", borderRadius:10, cursor:"pointer", transition:"all 0.15s", background:"var(--surface-2)", border:"1px solid var(--border)", color:"var(--muted)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}
                      onMouseEnter={ev=>{ ev.currentTarget.style.borderColor="var(--green)"; ev.currentTarget.style.color="var(--text)"; }}
                      onMouseLeave={ev=>{ ev.currentTarget.style.borderColor="var(--border)"; ev.currentTarget.style.color="var(--muted)"; }}
                    >
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <Zap size={12} style={{ color:"var(--green)", flexShrink:0 }} />
                        <span>{e}</span>
                      </div>
                      <ArrowUpRight size={13} style={{ flexShrink:0, opacity:0.35 }} />
                    </button>
                  ))}

                  <button onClick={toggleAutopilot}
                    className="autopilot-btn"
                    style={{ padding:"14px 16px", borderRadius:10, cursor:"pointer", transition:"all 0.2s", background:"var(--green-dim)", border:"1px solid var(--green-ring)", color:"var(--green)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, marginTop:4 }}
                    onMouseEnter={ev=>{ ev.currentTarget.style.background="rgba(34,197,94,0.13)"; }}
                    onMouseLeave={ev=>{ ev.currentTarget.style.background="var(--green-dim)"; }}
                  >
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:34, height:34, borderRadius:10, background:"rgba(34,197,94,0.15)", border:"1px solid var(--green-ring)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <Cpu size={15} />
                      </div>
                      <div style={{ textAlign:"left" }}>
                        <div style={{ fontWeight:700, fontSize:13 }}>Start Autopilot</div>
                        <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>Agent runs every 12s - pays real CKB, no human involved</div>
                      </div>
                    </div>
                    <Play size={14} fill="currentColor" style={{ flexShrink:0, opacity:0.8 }} />
                  </button>
                </div>

              </div>
            ) : (
              <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:10 }}>
                {msgs.map(m => <MsgItem key={m.id} m={m} running={running} />)}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{ flexShrink:0, padding:"12px 20px 14px", borderTop:"1px solid var(--border)", background:"var(--surface)" }}>
            <div style={{ display:"flex", gap:8 }}>
              <Input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&run()} placeholder="Ask anything - agent pays for data automatically…" disabled={running} className="flex-1" />
              <Button onClick={run} disabled={running||!input.trim()}>
                {running ? <><Loader2 size={13} className="anim-spin" />Running</> : <><SendHorizonal size={13}/>Run</>}
              </Button>
            </div>
            <p style={{ fontSize:11, color:"var(--subtle)", textAlign:"center", marginTop:8 }}>CKB Fiber Network · x402 Payment Protocol</p>
          </div>
        </main>

        {/* Right feed */}
        <aside className="hidden sm:flex" style={{ width:268, flexShrink:0, borderLeft:"1px solid var(--border)", background:"var(--surface)", overflow:"hidden" }}>
          <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column" }}>
            <Feed payments={payments} spent={spent} balance={balance} />
          </div>
        </aside>
      </div>
    </div>
  );
}
