"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Activity, Lock, Users, Terminal, Settings, Menu, X, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "SOC Dashboard", href: "/", icon: Activity, disabled: false },
  { name: "Password Analyzer", href: "/password-analyzer", icon: Lock, disabled: false },
  { name: "Threat Hunting", href: "/threat-hunting", icon: Terminal, disabled: false },
  { name: "Phishing Analyzer", href: "/phishing-analyzer", icon: Mail, disabled: false },
  { name: "Phishing Trainer", href: "/phishing", icon: Users, disabled: true },
  { name: "Firewall Sim", href: "/firewall", icon: Shield, disabled: true },
  { name: "Settings", href: "/settings", icon: Settings, disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={cn(
        "w-64 flex flex-col glass-panel h-screen border-r border-white/10 fixed md:sticky top-0 z-40 transition-transform duration-300",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 flex items-center gap-3 border-b border-white/5 mt-14 md:mt-0">
          <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">DEFENSE OS</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Simulation Platform</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 mt-2 px-2">
            Modules
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href;

            if (item.disabled) {
              return (
                <div key={item.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground/50 cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 opacity-50" />
                    {item.name}
                  </div>
                  <span className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-muted-foreground/70">SOON</span>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "opacity-70")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-background/40 rounded-lg p-3 border border-white/5 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
            <div className="text-xs text-muted-foreground">System Online</div>
          </div>
        </div>
      </aside>
    </>
  );
}
