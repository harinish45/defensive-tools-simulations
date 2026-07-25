"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, ShieldCheck, Siren, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Corners, LiveDot, Panel, SectionLabel, SevBadge, type Severity } from "@/components/ui/kit";

/* ----------------------------- data ----------------------------- */

type Incident = {
  id: number;
  time: string;
  severity: Severity;
  title: string;
  source: string;
  rule: string;
};

const INCIDENT_POOL: Omit<Incident, "id" | "time">[] = [
  { severity: "critical", title: "Emotet payload blocked", source: "WKST-042", rule: "MAL-014" },
  { severity: "critical", title: "Cobalt Strike beacon detected", source: "WKST-118", rule: "MAL-021" },
  { severity: "high", title: "SSH brute force detected", source: "203.0.113.45", rule: "AUTH-001" },
  { severity: "high", title: "SQL injection attempt", source: "198.51.100.77", rule: "WEB-001" },
  { severity: "high", title: "Path traversal attempt", source: "198.51.100.77", rule: "WEB-003" },
  { severity: "medium", title: "Suspicious URL shortener in mail", source: "mail-gw-01", rule: "PHISH-03" },
  { severity: "medium", title: "New local user created", source: "SRV-DB-02", rule: "SYS-001" },
  { severity: "medium", title: "Scanner user-agent observed", source: "198.51.100.77", rule: "WEB-004" },
  { severity: "low", title: "Firewall rule updated", source: "FW-EDGE-01", rule: "CFG-02" },
  { severity: "low", title: "Scheduled backup completed", source: "SRV-BK-01", rule: "OPS-11" },
];

const BOOT_LINES = [
  { tag: "OK", text: "sentinel core v2.0.0 initialized" },
  { tag: "OK", text: "loaded 47 detection rules" },
  { tag: "OK", text: "telemetry feed connected (simulated)" },
  { tag: "OK", text: "intel db synced — 16 IOCs" },
  { tag: "OK", text: "log analyzer engine ready" },
  { tag: "WARN", text: "simulation mode — no live traffic" },
  { tag: "OK", text: "all systems nominal" },
];

const RULES = [
  { id: "AUTH-001", name: "SSH Brute Force" },
  { id: "WEB-001", name: "SQL Injection" },
  { id: "WEB-002", name: "Cross-Site Scripting" },
  { id: "MAL-014", name: "Emotet Dropper" },
  { id: "SYS-002", name: "Pipe to Shell" },
  { id: "PHISH-03", name: "Credential Phishing" },
];

/* --------------------------- helpers ---------------------------- */

function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
      else prev.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${30 - (v / max) * 26}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-16 w-full">
      <polyline
        points={pts}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        className="spark-line"
      />
    </svg>
  );
}

function nowStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

/* ----------------------------- page ----------------------------- */

export default function Dashboard() {
  const [booted, setBooted] = useState(0);
  const [feed, setFeed] = useState<Incident[]>([]);
  const [history, setHistory] = useState<number[]>(() =>
    Array.from({ length: 28 }, () => 40 + Math.floor(Math.random() * 60))
  );
  const [eventsPerMin, setEventsPerMin] = useState(0);
  const [blocked, setBlocked] = useState(48291);
  const [sevCounts, setSevCounts] = useState({ critical: 1, high: 2, medium: 3, low: 2 });
  const idRef = useRef(1000);

  // Boot sequence
  useEffect(() => {
    if (booted >= BOOT_LINES.length) return;
    const id = setTimeout(() => setBooted((b) => b + 1), 320);
    return () => clearTimeout(id);
  }, [booted]);

  // Live telemetry
  useEffect(() => {
    const id = setInterval(() => {
      const pick = INCIDENT_POOL[Math.floor(Math.random() * INCIDENT_POOL.length)];
      idRef.current += 1;
      const incident: Incident = { ...pick, id: idRef.current, time: nowStamp() };
      setFeed((f) => [incident, ...f].slice(0, 7));
      const ev = 40 + Math.floor(Math.random() * 90);
      setEventsPerMin(ev);
      setHistory((h) => [...h.slice(1), ev]);
      setBlocked((b) => b + Math.floor(Math.random() * 6));
      setSevCounts((c) => ({ ...c, [pick.severity]: c[pick.severity as keyof typeof c] + 1 }));
    }, 2400);
    return () => clearInterval(id);
  }, []);

  const animEvents = useCountUp(eventsPerMin);
  const animBlocked = useCountUp(blocked);
  const activeAlerts = feed.filter((f) => f.severity === "critical" || f.severity === "high").length;
  const totalSev = Object.values(sevCounts).reduce((a, b) => a + b, 0) || 1;

  const stats = [
    { label: "Events / min", value: String(animEvents), sub: "live telemetry", accent: "text-cyan-300", icon: Activity },
    { label: "Active Alerts", value: String(activeAlerts), sub: "critical + high", accent: "text-orange-400", icon: Siren },
    { label: "Blocked (24h)", value: animBlocked.toLocaleString(), sub: "edge firewall", accent: "text-emerald-400", icon: ShieldCheck },
    { label: "Mean Time to Detect", value: "4m 12s", sub: "rolling average", accent: "text-amber-300", icon: Timer },
  ];

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            <LiveDot /> Live · Simulation Feed
          </div>
          <h1 className="mt-1 font-grotesk text-2xl font-bold tracking-tight">Security Operations Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time defensive telemetry. All data is generated locally in your browser.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="relative overflow-hidden rounded-xl border border-white/10 bg-card/60 p-4 backdrop-blur-lg">
            <Corners />
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{s.label}</div>
                <div className={cn("mt-2 font-mono text-3xl font-semibold tabular-nums", s.accent)}>{s.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.sub}</div>
              </div>
              <s.icon className={cn("h-5 w-5", s.accent)} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Throughput */}
          <Panel
            title="Event Throughput"
            scan
            tag={<span className="font-mono text-[11px] text-muted-foreground">last 28 ticks</span>}
          >
            <div className="flex items-end justify-between">
              <div>
                <div className="font-mono text-4xl font-semibold tabular-nums text-cyan-300 text-glow">
                  {animEvents}
                </div>
                <div className="text-xs text-muted-foreground">events per minute</div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>peak {Math.max(...history)}</div>
                <div>avg {Math.round(history.reduce((a, b) => a + b, 0) / history.length)}</div>
              </div>
            </div>
            <div className="mt-4">
              <Sparkline data={history} />
            </div>
          </Panel>

          {/* Live incident feed */}
          <Panel
            title="Live Incident Feed"
            tag={
              <span className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                <LiveDot /> streaming
              </span>
            }
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-white/5">
              {feed.length === 0 && (
                <li className="px-5 py-8 text-center text-sm text-muted-foreground">Awaiting telemetry…</li>
              )}
              {feed.map((inc) => (
                <li key={inc.id} className="animate-rise flex items-center gap-4 px-5 py-3">
                  <SevBadge level={inc.severity} className="w-24 justify-center" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{inc.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                      <span className="rounded bg-white/5 px-1.5 py-0.5">{inc.rule}</span>
                      <span className="truncate">{inc.source}</span>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{inc.time}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Boot terminal */}
          <Panel title="System Boot" scan>
            <div className="font-mono text-[12px] leading-relaxed">
              {BOOT_LINES.slice(0, booted).map((l, i) => (
                <div key={i} className="flex gap-2">
                  <span
                    className={cn(
                      "shrink-0 font-semibold",
                      l.tag === "OK" ? "text-emerald-400" : "text-amber-300"
                    )}
                  >
                    [{l.tag}]
                  </span>
                  <span className="text-muted-foreground">{l.text}</span>
                </div>
              ))}
              {booted < BOOT_LINES.length && <span className="animate-blink text-primary">▋</span>}
            </div>
          </Panel>

          {/* Severity distribution */}
          <Panel title="Severity Distribution">
            <div className="space-y-3">
              {(["critical", "high", "medium", "low"] as Severity[]).map((sev) => {
                const count = sevCounts[sev as "critical" | "high" | "medium" | "low"];
                const pct = Math.round((count / totalSev) * 100);
                const bar =
                  sev === "critical" ? "bg-red-500" : sev === "high" ? "bg-orange-500" : sev === "medium" ? "bg-amber-400" : "bg-sky-400";
                return (
                  <div key={sev}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="uppercase tracking-wider text-muted-foreground">{sev}</span>
                      <span className="font-mono tabular-nums">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div className={cn("h-full rounded-full transition-all duration-700", bar)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Detection rules */}
          <Panel title="Detection Rules" tag={<span className="font-mono text-[11px] text-emerald-400">47 ARMED</span>}>
            <ul className="space-y-2">
              {RULES.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                    <span className="text-muted-foreground">{r.name}</span>
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">{r.id}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <SectionLabel className="pt-2 text-center">
        Defense OS · educational simulation · no data leaves your browser
      </SectionLabel>
    </div>
  );
}
