import { AlertTriangle, ShieldAlert, Info, AlertCircle } from "lucide-react";

const alerts = [
  {
    id: "ALT-8923",
    severity: "critical",
    type: "Malware Detection",
    source: "Endpoint-WKST-042",
    time: "2 mins ago",
    status: "Investigating"
  },
  {
    id: "ALT-8922",
    severity: "high",
    type: "Suspicious Login Attempt",
    source: "192.168.1.105",
    time: "15 mins ago",
    status: "Open"
  },
  {
    id: "ALT-8921",
    severity: "medium",
    type: "Firewall Rule Triggered",
    source: "FW-EDGE-01",
    time: "42 mins ago",
    status: "Resolved"
  },
  {
    id: "ALT-8920",
    severity: "low",
    type: "Configuration Change",
    source: "AD-DC-02",
    time: "1 hr ago",
    status: "Resolved"
  }
];

const severityConfig = {
  critical: { icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
  high: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  medium: { icon: AlertCircle, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  low: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" }
};

export function RecentAlerts() {
  return (
    <div className="glass-panel rounded-xl border border-white/10 overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Recent Alerts</h3>
          <p className="text-sm text-muted-foreground">Latest security events requiring attention</p>
        </div>
        <button className="text-sm text-primary hover:underline font-medium">View All</button>
      </div>

      <div className="divide-y divide-white/5">
        {alerts.map((alert) => {
          const config = severityConfig[alert.severity as keyof typeof severityConfig];
          const Icon = config.icon;

          return (
            <div key={alert.id} className="p-4 hover:bg-white/5 transition-colors flex items-center gap-4 cursor-pointer">
              <div className={`p-2 rounded-lg border ${config.bg} ${config.border} ${config.color}`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold truncate">{alert.type}</h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{alert.time}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">{alert.id}</span>
                  <span>•</span>
                  <span className="truncate">{alert.source}</span>
                </div>
              </div>

              <div className="hidden sm:flex items-center">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  alert.status === 'Investigating' ? 'bg-primary/20 text-primary border border-primary/30' :
                  alert.status === 'Open' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' :
                  'bg-green-500/10 text-green-500 border border-green-500/20'
                }`}>
                  {alert.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
