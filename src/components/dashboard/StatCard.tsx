import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  color?: "primary" | "destructive" | "warning" | "success";
}

export function StatCard({ title, value, trend, trendUp, icon: Icon, color = "primary" }: StatCardProps) {
  const colorStyles = {
    primary: "text-primary bg-primary/10 border-primary/20",
    destructive: "text-destructive bg-destructive/10 border-destructive/20",
    warning: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    success: "text-green-500 bg-green-500/10 border-green-500/20",
  };

  return (
    <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
      {/* Subtle background glow based on color */}
      <div className={cn("absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-20 transition-opacity group-hover:opacity-40",
        color === 'primary' && "bg-primary",
        color === 'destructive' && "bg-destructive",
        color === 'warning' && "bg-orange-500",
        color === 'success' && "bg-green-500"
      )} />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight">{value}</h3>

          {trend && (
            <p className={cn("text-xs font-medium mt-2 flex items-center gap-1", trendUp ? "text-destructive" : "text-green-500")}>
              {trendUp ? "↑" : "↓"} {trend}
              <span className="text-muted-foreground ml-1">vs last 24h</span>
            </p>
          )}
        </div>

        <div className={cn("p-3 rounded-lg border", colorStyles[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
