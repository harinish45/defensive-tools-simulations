"use client";

import { useState } from "react";
import { Terminal, Search, AlertTriangle, CheckCircle, Globe, FileText, Hash, Clock, Shield, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface IOCEntry {
  indicator: string;
  type: "ip" | "domain" | "hash" | "url";
  threat: string;
  severity: "critical" | "high" | "medium" | "low";
  source: string;
  lastSeen: string;
  confidence: number;
}

const THREAT_INTEL_DB: IOCEntry[] = [
  { indicator: "185.220.101.34", type: "ip", threat: "Tor Exit Node - C2 Communication", severity: "critical", source: "AbuseIPDB", lastSeen: "2026-07-24", confidence: 95 },
  { indicator: "45.155.205.233", type: "ip", threat: "Brute Force SSH Attacks", severity: "high", source: "AlienVault OTX", lastSeen: "2026-07-23", confidence: 88 },
  { indicator: "evil-payload.tk", type: "domain", threat: "Malware Distribution", severity: "critical", source: "VirusTotal", lastSeen: "2026-07-25", confidence: 97 },
  { indicator: "phish-login.xyz", type: "domain", threat: "Credential Phishing", severity: "high", source: "PhishTank", lastSeen: "2026-07-22", confidence: 91 },
  { indicator: "d41d8cd98f00b204e9800998ecf8427e", type: "hash", threat: "Emotet Trojan Dropper", severity: "critical", source: "MalwareBazaar", lastSeen: "2026-07-20", confidence: 99 },
  { indicator: "5d41402abc4b2a76b9719d911017c592", type: "hash", threat: "Cobalt Strike Beacon", severity: "critical", source: "VirusTotal", lastSeen: "2026-07-21", confidence: 96 },
  { indicator: "http://malware-c2.ru/gate.php", type: "url", threat: "Command & Control Gateway", severity: "critical", source: "URLhaus", lastSeen: "2026-07-24", confidence: 94 },
  { indicator: "http://fake-update.com/payload.exe", type: "url", threat: "Trojan Downloader", severity: "high", source: "URLhaus", lastSeen: "2026-07-23", confidence: 92 },
  { indicator: "91.219.236.174", type: "ip", threat: "Ransomware Distribution", severity: "critical", source: "AbuseIPDB", lastSeen: "2026-07-25", confidence: 93 },
  { indicator: "crypto-miner-pool.cf", type: "domain", threat: "Cryptomining Pool", severity: "medium", source: "AlienVault OTX", lastSeen: "2026-07-19", confidence: 85 },
  { indicator: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6", type: "hash", threat: "Ransomware Payload (LockBit)", severity: "critical", source: "MalwareBazaar", lastSeen: "2026-07-24", confidence: 98 },
  { indicator: "103.224.182.252", type: "ip", threat: "Spam Botnet Node", severity: "medium", source: "Spamhaus", lastSeen: "2026-07-18", confidence: 82 },
];

export default function ThreatHunting() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IOCEntry[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      const q = query.toLowerCase().trim();
      const found = THREAT_INTEL_DB.filter(
        (entry) => entry.indicator.toLowerCase().includes(q) || entry.threat.toLowerCase().includes(q) || entry.type === q
      );
      setResults(found);
      setHasSearched(true);
      setIsSearching(false);
    }, 800);
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "critical": return { color: "text-red-400", bg: "bg-red-500/20 border-red-500/30", dot: "bg-red-500" };
      case "high": return { color: "text-orange-400", bg: "bg-orange-500/20 border-orange-500/30", dot: "bg-orange-500" };
      case "medium": return { color: "text-yellow-400", bg: "bg-yellow-500/20 border-yellow-500/30", dot: "bg-yellow-500" };
      default: return { color: "text-blue-400", bg: "bg-blue-500/20 border-blue-500/30", dot: "bg-blue-500" };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ip": return Globe;
      case "domain": return Globe;
      case "hash": return Hash;
      case "url": return FileText;
      default: return Database;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Terminal className="w-7 h-7 text-primary" />
          Threat Hunting
        </h1>
        <p className="text-muted-foreground">Search Indicators of Compromise (IOCs) against our simulated threat intelligence database.</p>
      </div>

      {/* Search Bar */}
      <div className="glass-panel rounded-xl p-6 border border-white/10">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by IP, domain, hash, URL, or threat type..."
              className="w-full bg-background/50 border border-white/10 rounded-lg pl-10 pr-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
          >
            {isSearching ? <Clock className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Hunt
          </button>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {["ip", "domain", "hash", "url"].map((type) => (
            <button
              key={type}
              onClick={() => { setQuery(type); }}
              className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="glass-panel rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              Results ({results.length})
            </h3>
            <span className="text-xs text-muted-foreground">Simulated Threat Intel DB</span>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-green-400 font-medium">No threats found</p>
              <p className="text-sm text-muted-foreground mt-1">The indicator was not found in our threat intelligence database.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((entry, i) => {
                const TypeIcon = getTypeIcon(entry.type);
                const sevConfig = getSeverityConfig(entry.severity);
                return (
                  <div key={i} className={cn("p-4 rounded-lg border", sevConfig.bg)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <TypeIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="text-sm font-mono font-medium">{entry.indicator}</code>
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold uppercase", sevConfig.color, sevConfig.bg)}>
                              {entry.severity}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{entry.threat}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {entry.source}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {entry.lastSeen}</span>
                            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {entry.confidence}% confidence</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total IOCs", value: THREAT_INTEL_DB.length.toString(), icon: Database },
          { label: "Critical", value: THREAT_INTEL_DB.filter(e => e.severity === "critical").length.toString(), icon: AlertTriangle },
          { label: "Sources", value: [...new Set(THREAT_INTEL_DB.map(e => e.source))].length.toString(), icon: Globe },
          { label: "Last Updated", value: "Today", icon: Clock },
        ].map((stat, i) => (
          <div key={i} className="glass-panel rounded-xl p-4 border border-white/10 text-center">
            <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
            <div className="text-xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
