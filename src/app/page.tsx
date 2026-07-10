import { Shield, Activity, Target, AlertOctagon } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { NetworkTrafficChart } from "@/components/dashboard/NetworkTrafficChart";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";

export default function Home() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SOC Dashboard</h1>
          <p className="text-muted-foreground">Real-time security operations overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 glass rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
            Generate Report
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(var(--primary),0.3)]">
            Hunt Threats
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Events (24h)"
          value="1.2M"
          trend="12.5%"
          trendUp={true}
          icon={Activity}
        />
        <StatCard
          title="Active Threats"
          value="3"
          trend="2"
          trendUp={true}
          icon={Target}
          color="warning"
        />
        <StatCard
          title="Blocked Attacks"
          value="48,291"
          trend="5.2%"
          trendUp={false}
          icon={Shield}
          color="success"
        />
        <StatCard
          title="Critical Alerts"
          value="1"
          trend="0"
          trendUp={false}
          icon={AlertOctagon}
          color="destructive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NetworkTrafficChart />
        </div>
        <div className="lg:col-span-1">
          <RecentAlerts />
        </div>
      </div>
    </div>
  );
}
