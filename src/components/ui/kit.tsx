import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export const SEV: Record<
  Severity,
  { text: string; bg: string; border: string; dot: string; label: string }
> = {
  critical: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", dot: "bg-red-500", label: "CRITICAL" },
  high: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", dot: "bg-orange-500", label: "HIGH" },
  medium: { text: "text-amber-300", bg: "bg-amber-400/10", border: "border-amber-400/30", dot: "bg-amber-400", label: "MEDIUM" },
  low: { text: "text-sky-300", bg: "bg-sky-400/10", border: "border-sky-400/30", dot: "bg-sky-400", label: "LOW" },
  info: { text: "text-cyan-300", bg: "bg-cyan-400/10", border: "border-cyan-400/30", dot: "bg-cyan-400", label: "INFO" },
};

/** Tactical corner brackets that give every panel its signature look. */
export function Corners({ className }: { className?: string }) {
  const base = "pointer-events-none absolute z-10 h-3 w-3 border-primary/50";
  return (
    <>
      <span className={cn(base, "left-0 top-0 border-l border-t", className)} />
      <span className={cn(base, "right-0 top-0 border-r border-t", className)} />
      <span className={cn(base, "bottom-0 left-0 border-b border-l", className)} />
      <span className={cn(base, "bottom-0 right-0 border-b border-r", className)} />
    </>
  );
}

/** Standard bordered panel with optional header, corner brackets and scanlines. */
export function Panel({
  title,
  tag,
  className,
  bodyClassName,
  scan,
  children,
}: {
  title?: string;
  tag?: ReactNode;
  className?: string;
  bodyClassName?: string;
  scan?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/10 bg-card/60 backdrop-blur-lg",
        className
      )}
    >
      <Corners />
      {scan && <div className="scanlines pointer-events-none absolute inset-0" />}
      {title && (
        <header className="relative z-10 flex items-center justify-between gap-3 border-b border-white/5 px-5 py-3">
          <h2 className="font-grotesk text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {title}
          </h2>
          {tag}
        </header>
      )}
      <div className={cn("relative z-10 p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground", className)}>
      {children}
    </div>
  );
}

export function SevBadge({ level, className }: { level: Severity; className?: string }) {
  const s = SEV[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider",
        s.text,
        s.bg,
        s.border,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-2 w-2", className)}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
  );
}

export function Stat({
  label,
  value,
  sub,
  accent = "text-cyan-300",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-card/60 p-4 backdrop-blur-lg">
      <Corners />
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={cn("mt-2 font-mono text-3xl font-semibold tabular-nums", accent)}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function PageHeader({
  icon: Icon,
  title,
  desc,
  badge,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  badge?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-4">
        <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-grotesk text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      {badge && (
        <span className="inline-flex w-fit items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {badge}
        </span>
      )}
    </div>
  );
}
