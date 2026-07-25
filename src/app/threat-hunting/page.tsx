"use client";

import { useMemo, useState } from "react";
import {
  Terminal,
  Search,
  CheckCircle,
  Globe,
  FileText,
  Hash,
  Clock,
  Shield,
  Database,
  Crosshair,
  List,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader, Panel, SevBadge, type Severity } from "@/components/ui/kit";

/* ------------------------------------------------------------------ */
/*  Simulated threat-intel database (all IOCs are fictional)           */
/* ------------------------------------------------------------------ */

type IOCType = "ip" | "domain" | "hash" | "url";

type IOC = {
  indicator: string;
  type: IOCType;
  threat: string;
  family: string;
  severity: Severity;
  source: string;
  firstSeen: string;
  confidence: number;
  tags: string[];
};

const INTEL: IOC[] = [
  { indicator: "203.0.113.45", type: "ip", threat: "SSH brute-force source", family: "Botnet", severity: "high", source: "AbuseIPDB", firstSeen: "2026-07-23", confidence: 88, tags: ["brute-force", "ssh"] },
  { indicator: "198.51.100.77", type: "ip", threat: "Web attack scanner", family: "Scanner", severity: "high", source: "AlienVault OTX", firstSeen: "2026-07-25", confidence: 90, tags: ["sqli", "xss", "scan"] },
  { indicator: "198.51.100.7", type: "ip", threat: "Phishing landing host", family: "PhishKit", severity: "critical", source: "PhishTank", firstSeen: "2026-07-24", confidence: 92, tags: ["phishing", "credential-harvest"] },
  { indicator: "203.0.113.66", type: "ip", threat: "Malware payload host", family: "Dropper", severity: "critical", source: "URLhaus", firstSeen: "2026-07-25", confidence: 95, tags: ["malware", "download"] },
  { indicator: "evil-payload.example", type: "domain", threat: "Malware distribution", family: "Emotet", severity: "critical", source: "MalwareBazaar", firstSeen: "2026-07-25", confidence: 97, tags: ["malware", "dropper"] },
  { indicator: "phish-login.example", type: "domain", threat: "Credential phishing", family: "PhishKit", severity: "high", source: "PhishTank", firstSeen: "2026-07-22", confidence: 91, tags: ["phishing"] },
  { indicator: "cdn-update.example", type: "domain", threat: "Cobalt Strike C2", family: "Cobalt Strike", severity: "critical", source: "VirusTotal", firstSeen: "2026-07-21", confidence: 96, tags: ["c2", "beacon"] },
  { indicator: "crypto-miner-pool.example", type: "domain", threat: "Cryptomining pool", family: "XMRig", severity: "medium", source: "AlienVault OTX", firstSeen: "2026-07-19", confidence: 85, tags: ["cryptominer"] },
  { indicator: "d41d8cd98f00b204e9800998ecf8427e", type: "hash", threat: "Emotet trojan dropper", family: "Emotet", severity: "critical", source: "MalwareBazaar", firstSeen: "2026-07-20", confidence: 99, tags: ["md5", "dropper"] },
  { indicator: "5d41402abc4b2a76b9719d911017c592", type: "hash", threat: "Cobalt Strike beacon", family: "Cobalt Strike", severity: "critical", source: "VirusTotal", firstSeen: "2026-07-21", confidence: 96, tags: ["md5", "c2"] },
  { indicator: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6", type: "hash", threat: "LockBit ransomware payload", family: "LockBit", severity: "critical", source: "MalwareBazaar", firstSeen: "2026-07-24", confidence: 98, tags: ["md5", "ransomware"] },
  { indicator: "e99a18c428cb38d5f260853678922e03", type: "hash", threat: "RedLine stealer", family: "RedLine", severity: "high", source: "VirusTotal", firstSeen: "2026-07-18", confidence: 93, tags: ["md5", "stealer"] },
  { indicator: "http://malware-c2.example/gate.php", type: "url", threat: "Command & control gateway", family: "Cobalt Strike", severity: "critical", source: "URLhaus", firstSeen: "2026-07-24", confidence: 94, tags: ["c2"] },
  { indicator: "http://fake-update.example/payload.exe", type: "url", threat: "Trojan downloader", family: "Dropper", severity: "high", source: "URLhaus", firstSeen: "2026-07-23", confidence: 92, tags: ["malware", "download"] },
];

/* ------------------------------------------------------------------ */
/*  IOC type auto-detection                                            */
/* ------------------------------------------------------------------ */

function detectType(q: string): IOCType | "text" {
  const s = q.trim();
  if (/^[a-f0-9]{64}$/i.test(s)) return "hash";
  if (/^[a-f0-9]{40}$/i.test(s)) return "hash";
  if (/^[a-f0-9]{32}$/i.test(s)) return "hash";
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(s)) {
    return s.split(".").every((o) => Number(o) <= 255) ? "ip" : "text";
  }
  if (/^https?:\/\//i.test(s)) return "url";
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(s)) return "domain";
  return "text";
}

function searchIntel(q: string): IOC[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const type = detectType(s);
  return INTEL.filter((e) => {
    if (type !== "text") {
      if (e.type === type && e.indicator.toLowerCase() === s) return true;
    }
    return (
      e.indicator.toLowerCase().includes(s) ||
      e.threat.toLowerCase().includes(s) ||
      e.family.toLowerCase().includes(s) ||
      e.tags.some((t) => t.includes(s))
    );
  });
}

const TYPE_ICON: Record<IOCType, typeof Globe> = { ip: Globe, domain: Globe, hash: Hash, url: FileText };

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ThreatHunting() {
  const [query, setQuery] = useState("");
  const [bulk, setBulk] = useState("");
  const [mode, setMode] = useState<"search" | "bulk" | "browse">("search");
  const [results, setResults] = useState<IOC[] | null>(null);
  const [bulkResults, setBulkResults] = useState<{ ioc: string; type: string; hits: IOC[] }[] | null>(null);
  const [searching, setSearching] = useState(false);

  const detected = useMemo(() => (query.trim() ? detectType(query) : null), [query]);

  const runSearch = () => {
    if (!query.trim()) return;
    setSearching(true);
    setTimeout(() => {
      setResults(searchIntel(query));
      setSearching(false);
    }, 500);
  };

  const runBulk = () => {
    const items = Array.from(new Set(bulk.split(/[\s,;\n]+/).map((x) => x.trim()).filter(Boolean)));
    setBulkResults(items.map((ioc) => ({ ioc, type: detectType(ioc), hits: searchIntel(ioc) })));
  };

  const stats = [
    { label: "Total IOCs", value: String(INTEL.length), icon: Database },
    { label: "Critical", value: String(INTEL.filter((e) => e.severity === "critical").length), icon: Crosshair },
    { label: "Families", value: String(new Set(INTEL.map((e) => e.family)).size), icon: Layers },
    { label: "Sources", value: String(new Set(INTEL.map((e) => e.source)).size), icon: Globe },
  ];

  const tabCls = (active: boolean) =>
    cn(
      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      active ? "border border-primary/20 bg-primary/10 text-primary" : "border border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground"
    );

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        icon={Terminal}
        title="Threat Hunting"
        desc="Query indicators of compromise (IOCs) against a bundled threat-intel dataset. Auto-detects IP, domain, hash and URL types, and supports bulk scanning."
        badge="simulated intel"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-card/60 p-4 text-center backdrop-blur-lg">
            <s.icon className="mx-auto mb-2 h-5 w-5 text-primary" />
            <div className="font-mono text-2xl font-semibold tabular-nums">{s.value}</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Mode tabs */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setMode("search")} className={tabCls(mode === "search")}>
          <Search className="h-4 w-4" /> Single Lookup
        </button>
        <button onClick={() => setMode("bulk")} className={tabCls(mode === "bulk")}>
          <List className="h-4 w-4" /> Bulk Scan
        </button>
        <button onClick={() => setMode("browse")} className={tabCls(mode === "browse")}>
          <Database className="h-4 w-4" /> Browse Intel
        </button>
      </div>

      {mode === "search" && (
        <>
          <Panel title="Indicator Lookup">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runSearch()}
                  placeholder="IP, domain, hash, URL, family or tag…"
                  className="w-full rounded-lg border border-white/10 bg-background/50 py-3 pl-10 pr-4 font-mono text-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <button
                onClick={runSearch}
                disabled={!query.trim() || searching}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {searching ? <Clock className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                Hunt
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Detected type:</span>
              <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono uppercase text-primary">
                {detected ?? "—"}
              </span>
              <span className="text-muted-foreground/60">try 203.0.113.45, evil-payload.example, emotet</span>
            </div>
          </Panel>

          {results && (
            <Panel title={`Results (${results.length})`} tag={<span className="font-mono text-[11px] text-muted-foreground">simulated intel db</span>}>
              {results.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
                  <p className="font-medium text-emerald-400">No matches found</p>
                  <p className="mt-1 text-sm text-muted-foreground">This indicator is not present in the dataset.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((e, i) => {
                    const Icon = TYPE_ICON[e.type];
                    return (
                      <div key={i} className="rounded-lg border border-white/5 bg-background/40 p-4">
                        <div className="flex items-start gap-3">
                          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <code className="break-all font-mono text-sm font-medium">{e.indicator}</code>
                              <SevBadge level={e.severity} />
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{e.threat}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> {e.source}</span>
                              <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {e.family}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {e.firstSeen}</span>
                              <span className="font-mono">{e.confidence}% conf</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {e.tags.map((t) => (
                                <span key={t} className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">#{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          )}
        </>
      )}

      {mode === "bulk" && (
        <>
          <Panel title="Bulk IOC Scan">
            <textarea
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              rows={6}
              placeholder={"Paste one indicator per line, e.g.\n203.0.113.45\nevil-payload.example\nd41d8cd98f00b204e9800998ecf8427e"}
              className="w-full resize-none rounded-lg border border-white/10 bg-background/50 px-3 py-2.5 font-mono text-[13px] transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={runBulk}
              disabled={!bulk.trim()}
              className="mt-3 flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <List className="h-4 w-4" /> Scan Indicators
            </button>
          </Panel>

          {bulkResults && (
            <Panel title={`Scan Report (${bulkResults.length})`}>
              <ul className="space-y-2">
                {bulkResults.map((r, i) => {
                  const hit = r.hits[0];
                  return (
                    <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-background/40 px-3 py-2.5">
                      <div className="min-w-0">
                        <code className="break-all font-mono text-sm">{r.ioc}</code>
                        <div className="text-[11px] text-muted-foreground">
                          type: {r.type}{hit ? ` · ${hit.threat}` : ""}
                        </div>
                      </div>
                      {hit ? <SevBadge level={hit.severity} /> : <span className="text-xs text-emerald-400">clean</span>}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
        </>
      )}

      {mode === "browse" && (
        <Panel title="Full Intel Dataset" tag={<span className="font-mono text-[11px] text-muted-foreground">{INTEL.length} IOCs</span>} bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Indicator</th>
                  <th className="px-3 py-3 font-semibold">Type</th>
                  <th className="px-3 py-3 font-semibold">Family</th>
                  <th className="px-3 py-3 font-semibold">Severity</th>
                  <th className="px-3 py-3 font-semibold">Conf</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {INTEL.map((e, i) => (
                  <tr key={i} className="transition-colors hover:bg-white/5">
                    <td className="max-w-[240px] truncate px-5 py-2.5 font-mono text-[13px]">{e.indicator}</td>
                    <td className="px-3 py-2.5 font-mono text-xs uppercase text-muted-foreground">{e.type}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{e.family}</td>
                    <td className="px-3 py-2.5"><SevBadge level={e.severity} /></td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{e.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
