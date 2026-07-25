"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Lock,
  Terminal,
  Mail,
  ScrollText,
  Network,
  Users,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveDot } from "@/components/ui/kit";

type NavItem = {
  name: string;
  href: string;
  icon: typeof Activity;
  disabled?: boolean;
};

type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ name: "SOC Dashboard", href: "/", icon: Activity }],
  },
  {
    label: "Analysis",
    items: [
      { name: "Password Analyzer", href: "/password-analyzer", icon: Lock },
      { name: "Phishing Analyzer", href: "/phishing-analyzer", icon: Mail },
      { name: "Log Analyzer", href: "/log-analyzer", icon: ScrollText },
    ],
  },
  {
    label: "Intelligence",
    items: [{ name: "Threat Hunting", href: "/threat-hunting", icon: Terminal }],
  },
  {
    label: "Network",
    items: [{ name: "Network Tools", href: "/network-tools", icon: Network }],
  },
  {
    label: "Coming Soon",
    items: [
      { name: "Phishing Trainer", href: "/phishing", icon: Users, disabled: true },
      { name: "Firewall Sim", href: "/firewall", icon: Shield, disabled: true },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {/* Mobile toggle */}
      <div className="fixed left-4 top-4 z-50 md:hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          className="glass rounded-lg p-2 transition-colors hover:bg-white/10"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "glass-panel fixed top-0 z-40 flex h-screen w-64 flex-col border-r border-white/10 transition-transform duration-300 md:sticky",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-white/5 p-6 pb-5 md:mt-0">
          <div className="relative grid h-11 w-11 place-items-center rounded-lg border border-primary/30 bg-primary/15">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div className="mt-10 md:mt-0">
            <h1 className="font-grotesk text-lg font-bold tracking-tight">DEFENSE OS</h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Blue Team Console
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-5 overflow-y-auto p-4">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);

                  if (item.disabled) {
                    return (
                      <div
                        key={item.name}
                        className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground/50"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 opacity-50" />
                          {item.name}
                        </div>
                        <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] tracking-wider text-muted-foreground/70">
                          SOON
                        </span>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        active
                          ? "border border-primary/20 bg-primary/10 text-primary"
                          : "border border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
                      )}
                      <item.icon className={cn("h-4 w-4", active ? "text-primary" : "opacity-70")} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer status */}
        <div className="border-t border-white/5 p-4">
          <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-background/40 p-3">
            <LiveDot />
            <div className="flex-1">
              <div className="text-xs font-medium text-foreground">System Online</div>
              <div className="font-mono text-[10px] text-muted-foreground">v2.0.0 · simulation</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
