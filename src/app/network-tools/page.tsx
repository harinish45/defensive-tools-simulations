"use client";

import { useMemo, useState } from "react";
import { Network, Calculator, Server, Search, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Corners, PageHeader, Panel } from "@/components/ui/kit";

/* ------------------------------------------------------------------ */
/*  Real CIDR subnet math                                              */
/* ------------------------------------------------------------------ */

function ipToInt(ip: string): number {
  return ip.split(".").reduce((acc, oct) => (acc * 256 + Number(oct)) >>> 0, 0) >>> 0;
}

function intToIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

function validIp(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
}

type SubnetResult = {
  netmask: string;
  wildcard: string;
  network: string;
  broadcast: string;
  first: string;
  last: string;
  hosts: number;
  cidr: string;
  ipClass: string;
  scope: string;
};

function calcSubnet(input: string): SubnetResult | null {
  const m = input.trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/);
  if (!m) return null;
  const [, ip, prefStr] = m;
  const prefix = Number(prefStr);
  if (!validIp(ip) || prefix < 0 || prefix > 32) return null;

  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const wildcard = (~mask) >>> 0;
  const ipInt = ipToInt(ip);
  const network = (ipInt & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const total = Math.pow(2, 32 - prefix);
  const hosts = prefix >= 31 ? (prefix === 32 ? 1 : 2) : total - 2;
  const first = prefix >= 31 ? intToIp(network) : intToIp((network + 1) >>> 0);
  const last = prefix >= 31 ? intToIp(broadcast) : intToIp((broadcast - 1) >>> 0);

  const firstOctet = (network >>> 24) & 255;
  const ipClass = firstOctet < 128 ? "A" : firstOctet < 192 ? "B" : firstOctet < 224 ? "C" : firstOctet < 240 ? "D (multicast)" : "E (reserved)";
  const scope =
    firstOctet === 10 || (firstOctet === 172 && ((network >>> 16) & 255) >= 16 && ((network >>> 16) & 255) <= 31) || (firstOctet === 192 && ((network >>> 16) & 255) === 168)
      ? "Private (RFC 1918)"
      : "Public";

  return {
    netmask: intToIp(mask),
    wildcard: intToIp(wildcard),
    network: intToIp(network),
    broadcast: intToIp(broadcast),
    first,
    last,
    hosts,
    cidr: `${intToIp(network)}/${prefix}`,
    ipClass,
    scope,
  };
}

/* ------------------------------------------------------------------ */
/*  Port reference                                                     */
/* ------------------------------------------------------------------ */

type Port = { port: number; proto: string; service: string; note: string; risk: boolean };

const PORTS: Port[] = [
  { port: 20, proto: "TCP", service: "FTP Data", note: "File transfer (data channel)", risk: false },
  { port: 21, proto: "TCP", service: "FTP", note: "Cleartext file transfer", risk: true },
  { port: 22, proto: "TCP", service: "SSH", note: "Secure remote admin — brute-force target", risk: true },
  { port: 23, proto: "TCP", service: "Telnet", note: "Cleartext remote login — never expose", risk: true },
  { port: 25, proto: "TCP", service: "SMTP", note: "Mail transfer", risk: false },
  { port: 53, proto: "TCP/UDP", service: "DNS", note: "Name resolution — tunneling vector", risk: true },
  { port: 80, proto: "TCP", service: "HTTP", note: "Cleartext web", risk: false },
  { port: 110, proto: "TCP", service: "POP3", note: "Cleartext mail retrieval", risk: true },
  { port: 135, proto: "TCP", service: "MS RPC", note: "Windows RPC — common attack surface", risk: true },
  { port: 139, proto: "TCP", service: "NetBIOS", note: "Legacy Windows file sharing", risk: true },
  { port: 143, proto: "TCP", service: "IMAP", note: "Cleartext mail", risk: true },
  { port: 389, proto: "TCP", service: "LDAP", note: "Directory access (cleartext)", risk: true },
  { port: 443, proto: "TCP", service: "HTTPS", note: "Encrypted web", risk: false },
  { port: 445, proto: "TCP", service: "SMB", note: "File sharing — ransomware/worm target", risk: true },
  { port: 465, proto: "TCP", service: "SMTPS", note: "Encrypted mail submission", risk: false },
  { port: 587, proto: "TCP", service: "SMTP (submit)", note: "Mail submission", risk: false },
  { port: 636, proto: "TCP", service: "LDAPS", note: "Encrypted directory", risk: false },
  { port: 993, proto: "TCP", service: "IMAPS", note: "Encrypted mail", risk: false },
  { port: 1433, proto: "TCP", service: "MSSQL", note: "Microsoft SQL Server", risk: true },
  { port: 1521, proto: "TCP", service: "Oracle DB", note: "Oracle database", risk: true },
  { port: 3306, proto: "TCP", service: "MySQL", note: "MySQL database", risk: true },
  { port: 3389, proto: "TCP", service: "RDP", note: "Remote Desktop — heavily targeted", risk: true },
  { port: 5432, proto: "TCP", service: "PostgreSQL", note: "Postgres database", risk: true },
  { port: 5900, proto: "TCP", service: "VNC", note: "Remote desktop (often weak auth)", risk: true },
  { port: 6379, proto: "TCP", service: "Redis", note: "In-memory store — often unauthenticated", risk: true },
  { port: 8080, proto: "TCP", service: "HTTP-Alt", note: "Alternate web / proxy", risk: false },
  { port: 8443, proto: "TCP", service: "HTTPS-Alt", note: "Alternate secure web", risk: false },
  { port: 9200, proto: "TCP", service: "Elasticsearch", note: "Search engine — data exposure risk", risk: true },
  { port: 11211, proto: "TCP/UDP", service: "Memcached", note: "Cache — amplification abuse", risk: true },
  { port: 27017, proto: "TCP", service: "MongoDB", note: "NoSQL — often misconfigured", risk: true },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function NetworkTools() {
  const [tab, setTab] = useState<"subnet" | "ports">("subnet");
  const [cidr, setCidr] = useState("192.168.1.0/24");
  const [portQuery, setPortQuery] = useState("");

  const result = useMemo(() => calcSubnet(cidr), [cidr]);

  const filteredPorts = useMemo(() => {
    const q = portQuery.trim().toLowerCase();
    if (!q) return PORTS;
    return PORTS.filter(
      (p) => String(p.port).includes(q) || p.service.toLowerCase().includes(q) || p.note.toLowerCase().includes(q)
    );
  }, [portQuery]);

  const presets = ["192.168.1.0/24", "10.0.0.0/8", "172.16.5.130/26", "192.168.10.45/30"];

  const tabCls = (active: boolean) =>
    cn(
      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      active ? "border border-primary/20 bg-primary/10 text-primary" : "border border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground"
    );

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        icon={Network}
        title="Network Tools"
        desc="A real CIDR subnet calculator (network, broadcast, usable range, host count) and a searchable reference of commonly abused ports."
        badge="real math"
      />

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTab("subnet")} className={tabCls(tab === "subnet")}>
          <Calculator className="h-4 w-4" /> Subnet Calculator
        </button>
        <button onClick={() => setTab("ports")} className={tabCls(tab === "ports")}>
          <Server className="h-4 w-4" /> Port Reference
        </button>
      </div>

      {tab === "subnet" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Panel title="Input" className="lg:col-span-1">
            <label className="mb-1 block text-xs text-muted-foreground">CIDR notation</label>
            <input
              value={cidr}
              onChange={(e) => setCidr(e.target.value)}
              placeholder="192.168.1.0/24"
              spellCheck={false}
              className="w-full rounded-lg border border-white/10 bg-background/50 px-3 py-2.5 font-mono text-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setCidr(p)}
                  className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="mt-4">
              {result ? (
                <p className="flex items-center gap-2 text-sm text-emerald-400">
                  <CheckCircle className="h-4 w-4" /> Valid CIDR — {result.scope}
                </p>
              ) : (
                <p className="flex items-center gap-2 text-sm text-red-400">
                  <XCircle className="h-4 w-4" /> Invalid — use format a.b.c.d/prefix
                </p>
              )}
            </div>
          </Panel>

          <div className="lg:col-span-2">
            {result ? (
              <Panel title="Results" scan>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { label: "Network Address", value: result.network },
                    { label: "Netmask", value: result.netmask },
                    { label: "Broadcast", value: result.broadcast },
                    { label: "Wildcard", value: result.wildcard },
                    { label: "First Usable", value: result.first },
                    { label: "Last Usable", value: result.last },
                    { label: "CIDR", value: result.cidr },
                    { label: "Class / Scope", value: `${result.ipClass} · ${result.scope}` },
                  ].map((row) => (
                    <div key={row.label} className="rounded-lg border border-white/5 bg-background/40 p-3">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{row.label}</div>
                      <div className="mt-1 break-all font-mono text-sm text-foreground">{row.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Usable Hosts</div>
                  <div className="mt-1 font-mono text-4xl font-semibold tabular-nums text-cyan-300 text-glow">
                    {result.hosts.toLocaleString()}
                  </div>
                </div>
              </Panel>
            ) : (
              <Panel className="h-full min-h-[240px]" bodyClassName="flex h-full min-h-[200px] items-center justify-center">
                <p className="text-sm text-muted-foreground">Enter a valid CIDR block to see the breakdown.</p>
              </Panel>
            )}
          </div>
        </div>
      )}

      {tab === "ports" && (
        <Panel
          title="Port Reference"
          tag={<span className="font-mono text-[11px] text-muted-foreground">{filteredPorts.length} ports</span>}
          bodyClassName="p-0"
        >
          <div className="border-b border-white/5 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={portQuery}
                onChange={(e) => setPortQuery(e.target.value)}
                placeholder="Search by port, service or note…"
                className="w-full rounded-lg border border-white/10 bg-background/50 py-2.5 pl-10 pr-4 text-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-card/95 backdrop-blur">
                <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Port</th>
                  <th className="px-3 py-3 font-semibold">Proto</th>
                  <th className="px-3 py-3 font-semibold">Service</th>
                  <th className="px-3 py-3 font-semibold">Note</th>
                  <th className="px-3 py-3 font-semibold">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPorts.map((p) => (
                  <tr key={p.port} className="transition-colors hover:bg-white/5">
                    <td className="px-5 py-2.5 font-mono font-semibold tabular-nums">{p.port}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{p.proto}</td>
                    <td className="px-3 py-2.5 font-medium">{p.service}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{p.note}</td>
                    <td className="px-3 py-2.5">
                      {p.risk ? (
                        <span className="rounded border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                          TARGETED
                        </span>
                      ) : (
                        <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          STANDARD
                        </span>
                      )}
                    </td>
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
