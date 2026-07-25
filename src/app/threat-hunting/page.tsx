"use client";

import { useState } from "react";
import {
  Terminal,
  Search,
  CheckCircle,
  Globe,
  Hash,
  Clock,
  Shield,
  Crosshair,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader, Panel, SevBadge, type Severity } from "@/components/ui/kit";

type IOCType = "ip" | "domain" | "hash" | "text";

function detectType(q: string): IOCType {
  const s = q.trim();
  if (/^[a-f0-9]{64}$/i.test(s)) return "hash";
  if (/^[a-f0-9]{40}$/i.test(s)) return "hash";
  if (/^[a-f0-9]{32}$/i.test(s)) return "hash";
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(s)) {
    return s.split(".").every((o) => Number(o) <= 255) ? "ip" : "text";
  }
  if (/^https?:\/\//i.test(s)) return "domain";
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(s)) return "domain";
  return "text";
}

type IpInfo = {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  org: string;
  asn: string;
  threat?: { is_tor: boolean; is_proxy: boolean; is_known_attacker: boolean };
} | null;

type DnsInfo = {
  Status: number;
  Answer?: { name: string; type: number; data: string }[];
} | null;

type HashInfo = {
  FileName?: string;
  SHA256?: string;
  TLHLevel?: number;
} | null;

export default function ThreatHunting() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [ipInfo, setIpInfo] = useState<IpInfo>(null);
  const [dnsInfo, setDnsInfo] = useState<DnsInfo>(null);
  const [hashInfo, setHashInfo] = useState<HashInfo>(null);
  
  const detected = query.trim() ? detectType(query) : "text";

  const runHunt = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setIpInfo(null);
    setDnsInfo(null);
    setHashInfo(null);

    const q = query.trim();
    const type = detectType(q);

    try {
      if (type === "ip") {
        const res = await fetch(`https://ipapi.co/${q}/json/`);
        const data = await res.json();
        if (data.error) throw new Error(data.reason || "Invalid IP or rate limited");
        setIpInfo(data);
      } else if (type === "domain") {
        const cleanDomain = q.replace(/^https?:\/\//i, "").split("/")[0];
        const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(cleanDomain)}`);
        const data = await res.json();
        if (data.Status !== 0 && data.Status !== 3) {
          throw new Error("DNS resolution failed");
        }
        setDnsInfo(data);
      } else if (type === "hash") {
        const hashType = q.length === 32 ? "md5" : q.length === 40 ? "sha1" : "sha256";
        const res = await fetch(`https://hashlookup.circl.lu/lookup/${hashType}/${q}`);
        const data = await res.json();
        if (data["known"] === false) {
          setHashInfo(null);
        } else {
          setHashInfo(data);
        }
      } else {
        throw new Error("Unsupported indicator type. Please enter a valid IP, domain, or hash.");
      }
    } catch (err: any) {
      setError(err.message || "Hunt failed");
    } finally {
      setLoading(false);
    }
  };

  const getSeverity = (): Severity => {
    if (ipInfo?.threat?.is_known_attacker || ipInfo?.threat?.is_tor) return "critical";
    if (hashInfo?.TLHLevel && hashInfo.TLHLevel >= 5) return "critical";
    if (hashInfo?.TLHLevel && hashInfo.TLHLevel >= 3) return "high";
    return "info";
  };

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        icon={Terminal}
        title="Threat Hunting"
        desc="Real-time IOC enrichment. Queries live public APIs: ipapi.co for IP geolocation/ASN, Google Public DNS for domain resolution, and CIRCL Hashlookup for malware hashes."
        badge="live api"
      />

      <Panel title="Indicator Lookup">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runHunt()}
              placeholder="IP (e.g., 8.8.8.8), domain (e.g., google.com), or hash (MD5/SHA1/SHA256)"
              className="w-full rounded-lg border border-white/10 bg-background/50 py-3 pl-10 pr-4 font-mono text-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            onClick={runHunt}
            disabled={!query.trim() || loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
            Hunt
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Detected type:</span>
          <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono uppercase text-primary">
            {detected}
          </span>
        </div>
      </Panel>

      {error && (
        <Panel title="Error" tag={<AlertTriangle className="h-4 w-4 text-red-500" />}>
          <p className="text-sm text-red-400">{error}</p>
        </Panel>
      )}

      {!loading && !error && ipInfo && (
        <Panel title="IP Intelligence" tag={<SevBadge level={getSeverity()} />}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">IP Address</div>
              <div className="font-mono text-lg font-semibold">{ipInfo.ip}</div>
            </div>
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Organization / ASN</div>
              <div className="font-mono text-sm">{ipInfo.org} ({ipInfo.asn})</div>
            </div>
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Location</div>
              <div className="text-sm">{ipInfo.city}, {ipInfo.region}, {ipInfo.country_name}</div>
            </div>
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Threat Indicators</div>
              <div className="flex flex-wrap gap-2">
                {ipInfo.threat?.is_tor && <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-400">TOR Exit Node</span>}
                {ipInfo.threat?.is_proxy && <span className="rounded bg-orange-500/20 px-2 py-0.5 text-xs text-orange-400">Proxy</span>}
                {ipInfo.threat?.is_known_attacker && <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-400">Known Attacker</span>}
                {!ipInfo.threat?.is_tor && !ipInfo.threat?.is_proxy && !ipInfo.threat?.is_known_attacker && (
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">No known threats</span>
                )}
              </div>
            </div>
          </div>
        </Panel>
      )}

      {!loading && !error && dnsInfo && (
        <Panel title="DNS Resolution" tag={<SevBadge level={dnsInfo.Status === 3 ? "high" : "info" />}>
          {dnsInfo.Status === 3 ? (
            <p className="text-sm text-muted-foreground">NXDOMAIN: Domain does not exist.</p>
          ) : (
            <div className="space-y-3">
              {dnsInfo.Answer?.map((record, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-white/5 bg-background/40 p-3">
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-primary">
                        {record.type === 1 ? "A" : record.type === 28 ? "AAAA" : record.type === 15 ? "MX" : record.type === 16 ? "TXT" : record.type === 2 ? "NS" : `TYPE${record.type}`}
                      </span>
                      <code className="break-all font-mono text-sm">{record.data}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {!loading && !error && hashInfo && (
        <Panel title="Hash Intelligence" tag={<SevBadge level={getSeverity()} />}>
          <div className="space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">File Name</div>
                <div className="font-mono text-sm">{hashInfo.FileName || "Unknown"}</div>
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Threat Level</div>
                <div className="font-mono text-sm">{hashInfo.TLHLevel || "N/A"}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">SHA256</div>
              <code className="break-all font-mono text-xs text-muted-foreground">{hashInfo.SHA256 || "N/A"}</code>
            </div>
          </div>
        </Panel>
      )}

      {!loading && !error && !ipInfo && !dnsInfo && !hashInfo && query.trim() && detected !== "text" && (
        <Panel title="Result">
          <div className="py-8 text-center">
            <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
            <p className="font-medium text-emerald-400">Clean / Not Found in Threat DB</p>
            <p className="mt-1 text-sm text-muted-foreground">This indicator returned no malicious hits from live APIs.</p>
          </div>
        </Panel>
      )}
    </div>
  );
}