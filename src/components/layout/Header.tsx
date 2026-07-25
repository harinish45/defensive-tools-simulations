"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, ShieldAlert, Radio } from "lucide-react";
import { LiveDot } from "@/components/ui/kit";

const NAMES: Record<string, string> = {
  "/": "SOC Dashboard",
  "/password-analyzer": "Password Analyzer",
  "/phishing-analyzer": "Phishing Analyzer",
  "/threat-hunting": "Threat Hunting",
  "/log-analyzer": "Log Analyzer",
  "/network-tools": "Network Tools",
};

function useUtcClock() {
  const [time, setTime] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, "0");
      setTime(`${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function Header() {
  const pathname = usePathname();
  const clock = useUtcClock();
  const moduleName =
    NAMES[pathname] ?? Object.entries(NAMES).find(([p]) => pathname.startsWith(p) && p !== "/")?.[1] ?? "Console";

  return (
    <header className="glass sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-white/5 px-4 md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="min-w-0 pl-12 md:pl-0">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <Radio className="h-3 w-3 text-primary" />
            Module
          </div>
          <div className="truncate font-grotesk text-sm font-semibold">{moduleName}</div>
        </div>

        <div className="relative hidden w-full max-w-md sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events, IPs, hashes…"
            className="w-full rounded-full border border-white/10 bg-background/50 py-1.5 pl-10 pr-4 text-sm transition-all placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <div className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs tabular-nums text-muted-foreground lg:flex">
          <LiveDot />
          {clock} UTC
        </div>

        <button
          aria-label="Notifications"
          className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        </button>

        <div className="h-8 w-px bg-white/10" />

        <div className="flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">DEFCON 4</span>
          <span className="sm:hidden">D4</span>
        </div>
      </div>
    </header>
  );
}
