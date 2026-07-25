"use client";

import { useState, useMemo } from "react";
import {
  Mail,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Shield,
  Zap,
  Clock,
  FlaskConical,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Corners, PageHeader, Panel, SevBadge, type Severity } from "@/components/ui/kit";

const SUSPICIOUS_TLDS = [".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".buzz", ".club", ".work", ".icu", ".click", ".link", ".loan"];
const SHORTENERS = ["bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd", "buff.ly", "rebrand.ly", "cutt.ly", "rb.gy", "shorturl.at"];
const FREE_MAIL = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "proton.me", "aol.com", "gmx.com"];
const URGENCY = ["immediately", "urgent", "action required", "expires", "suspended", "verify now", "account locked", "last warning", "final notice", "act now", "within 24 hours", "final warning", "without delay"];
const PHISH_PHRASES = ["wire transfer", "gift card", "reset your password", "confirm your identity", "unusual activity", "payment failed", "invoice attached", "click here to verify", "update your payment", "security alert", "verify your identity", "validate your credentials"];
const BRANDS: { name: string; domains: string[] }[] = [
  { name: "microsoft", domains: ["microsoft.com", "office.com", "live.com", "outlook.com", "windows.com"] },
  { name: "paypal", domains: ["paypal.com"] },
  { name: "amazon", domains: ["amazon.com"] },
  { name: "apple", domains: ["apple.com", "icloud.com"] },
  { name: "google", domains: ["google.com", "gmail.com"] },
  { name: "netflix", domains: ["netflix.com"] },
  { name: "dhl", domains: ["dhl.com"] },
  { name: "fedex", domains: ["fedex.com"] },
  { name: "linkedin", domains: ["linkedin.com"] },
  { name: "dropbox", domains: ["dropbox.com"] },
];

type Finding = { type: string; detail: string; severity: Severity };
type Result = { score: number; verdict: "safe" | "suspicious" | "phishing"; findings: Finding[] };

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

function domainOf(email: string): string {
  const at = email.lastIndexOf("@");
  if (at === -1) return "";
  return email.slice(at + 1).replace(/[>\s]/g, "").toLowerCase();
}

function displayNameOf(from: string): string {
  const lt = from.indexOf("<");
  return (lt === -1 ? from : from.slice(0, lt)).trim().toLowerCase();
}

function analyze(sender: string, replyTo: string, subject: string, body: string): Result {
  const findings: Finding[] = [];
  let score = 0;
  const full = `${subject} ${body}`.toLowerCase();
  const senderDomain = domainOf(sender);
  const displayName = displayNameOf(sender);

  const urls = body.match(/https?:\/\/[^\s<>"]+/gi) || [];
  urls.forEach((url) => {
    const dom = url.split("//")[1]?.split("/")[0]?.toLowerCase() ?? "";
    if (SUSPICIOUS_TLDS.some((t) => dom.endsWith(t))) {
      score += 25;
      findings.push({ type: "Suspicious link TLD", detail: dom, severity: "high" });
    }
    if (SHORTENERS.some((s) => dom.includes(s))) {
      score += 20;
      findings.push({ type: "URL shortener", detail: dom, severity: "high" });
    }
    if (/^\d+\.\d+\.\d+\.\d+/.test(dom)) {
      score += 20;
      findings.push({ type: "Raw IP in link", detail: dom, severity: "high" });
    }
  });

  if (/xn--/.test(body.toLowerCase())) {
    score += 20;
    findings.push({ type: "Punycode domain", detail: "xn-- homograph", severity: "high" });
  }

  URGENCY.forEach((w) => {
    if (full.includes(w)) {
      score += 8;
      findings.push({ type: "Urgency language", detail: `“${w}”`, severity: "medium" });
    }
  });
  PHISH_PHRASES.forEach((p) => {
    if (full.includes(p)) {
      score += 12;
      findings.push({ type: "Phishing phrase", detail: `“${p}”`, severity: "high" });
    }
  });

  if (senderDomain) {
    if (SUSPICIOUS_TLDS.some((t) => senderDomain.endsWith(t))) {
      score += 20;
      findings.push({ type: "Suspicious sender TLD", detail: senderDomain, severity: "high" });
    }
    if (FREE_MAIL.includes(senderDomain)) {
      score += 10;
      findings.push({ type: "Free-mail sender", detail: senderDomain, severity: "low" });
    }
    const haystack = `${subject} ${displayName}`.toLowerCase();
    for (const brand of BRANDS) {
      if (haystack.includes(brand.name) && !brand.domains.includes(senderDomain)) {
        const lookalike = brand.domains.some((d) => levenshtein(senderDomain, d) <= 2);
        if (lookalike) {
          score += 30;
          findings.push({ type: "Lookalike domain", detail: `${senderDomain} ≈ ${brand.domains[0]}`, severity: "critical" });
        } else {
          score += 18;
          findings.push({ type: "Brand impersonation", detail: `${brand.name} → ${senderDomain}`, severity: "high" });
        }
        break;
      }
    }
  }

  if (replyTo && senderDomain) {
    const rdom = domainOf(replyTo);
    if (rdom && rdom !== senderDomain) {
      score += 15;
      findings.push({ type: "Reply-To mismatch", detail: `${senderDomain} → ${rdom}`, severity: "medium" });
    }
  }

  if (/dear (customer|user|member|client)/.test(full)) {
    score += 8;
    findings.push({ type: "Generic greeting", detail: "dear customer", severity: "low" });
  }

  score = Math.min(100, score);
  const verdict = score >= 50 ? "phishing" : score >= 20 ? "suspicious" : "safe";
  return { score, verdict, findings };
}

const SAMPLES = {
  phishing: {
    label: "Credential Phish",
    sender: "PayPal Security <security@paypal-verify-alert.tk>",
    replyTo: "helpdesk221@gmail.com",
    subject: "URGENT: Your account has been suspended!",
    body: `Dear Customer,\n\nWe detected unusual activity on your account. You must verify your identity IMMEDIATELY or your account will be permanently locked.\n\nClick here to verify: http://bit.ly/paypal-secure-login\n\nThis is your FINAL WARNING. Act now to avoid suspension. Please update your payment information and reset your password.\n\nRegards,\nPayPal Security Team`,
  },
  lookalike: {
    label: "Lookalike Domain",
    sender: "Microsoft 365 <admin@rnicrosoft-secure.com>",
    replyTo: "",
    subject: "Action required: verify your mailbox",
    body: `Dear Customer,\n\nYour mailbox will be suspended within 24 hours due to unusual activity. Verify now to keep access.\n\nSign in: http://198.51.100.7/login\n\nMicrosoft 365 Team`,
  },
  safe: {
    label: "Legitimate",
    sender: "GitHub <noreply@github.com>",
    replyTo: "",
    subject: "[GitHub] Your weekly digest",
    body: `Hi there,\n\nHere's your weekly activity summary:\n- 3 repositories updated\n- 2 pull requests merged\n- 1 new follower\n\nView your dashboard at https://github.com/dashboard\n\nThanks,\nThe GitHub Team`,
  },
};

type SampleKey = keyof typeof SAMPLES;

export default function PhishingAnalyzer() {
  const [sender, setSender] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [liveUrlCheck, setLiveUrlCheck] = useState<{ url: string; title: string; status: "loading" | "success" | "error" } | null>(null);

  const detectedUrls = useMemo(() => body.match(/https?:\/\/[^\s<>"]+/gi) || [], [body]);

  const loadSample = (key: SampleKey) => {
    const s = SAMPLES[key];
    setSender(s.sender);
    setReplyTo(s.replyTo);
    setSubject(s.subject);
    setBody(s.body);
    setResult(null);
    setLiveUrlCheck(null);
  };

  const handleAnalyze = () => {
    if (!sender && !body) return;
    setAnalyzing(true);
    setResult(null);
    setLiveUrlCheck(null);
    setTimeout(() => {
      setResult(analyze(sender, replyTo, subject, body));
      setAnalyzing(false);
    }, 900);
  };

  const checkLiveUrl = async (url: string) => {
    setLiveUrlCheck({ url, title: "Fetching live content...", status: "loading" });
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) });
      const html = await res.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "No Title Found";
      setLiveUrlCheck({ url, title, status: "success" });
    } catch (e) {
      setLiveUrlCheck({ url, title: "Fetch Blocked (CORS/Network/Error)", status: "error" });
    }
  };

  const verdictCfg =
    result?.verdict === "phishing"
      ? { icon: XCircle, color: "text-red-400", ring: "border-red-500/30 bg-red-500/10", label: "Likely Phishing" }
      : result?.verdict === "suspicious"
      ? { icon: AlertTriangle, color: "text-orange-400", ring: "border-orange-500/30 bg-orange-500/10", label: "Suspicious" }
      : { icon: CheckCircle, color: "text-emerald-400", ring: "border-emerald-500/30 bg-emerald-500/10", label: "Likely Safe" };

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-background/50 px-3 py-2.5 text-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        icon={Mail}
        title="Phishing Email Analyzer"
        desc="Dissect a suspicious email for social-engineering tactics, lookalike domains, deceptive links and impersonation. Weighted heuristics + live URL fetching produce a threat verdict."
        badge="13+ heuristics + live"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Panel
            title="Email Input"
            tag={
              <div className="flex gap-1.5">
                {(Object.keys(SAMPLES) as SampleKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => loadSample(k)}
                    className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                  >
                    {SAMPLES[k].label}
                  </button>
                ))}
              </div>
            }
          >
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">From</label>
                <input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="Name <address@domain>" className={cn(inputCls, "font-mono")} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Reply-To (optional)</label>
                <input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="address@domain" className={cn(inputCls, "font-mono")} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Subject</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line" className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Paste the full email body, including any links…"
                  rows={9}
                  className={cn(inputCls, "resize-none font-mono text-[13px]")}
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={(!sender && !body) || analyzing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {analyzing ? <Clock className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {analyzing ? "Analyzing…" : "Analyze Email"}
              </button>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          {result ? (
            <>
              <div className={cn("relative overflow-hidden rounded-xl border p-6 backdrop-blur-lg", verdictCfg.ring)}>
                <Corners />
                <div className="flex items-center gap-4">
                  <verdictCfg.icon className={cn("h-11 w-11", verdictCfg.color)} />
                  <div>
                    <div className={cn("font-grotesk text-xl font-bold", verdictCfg.color)}>{verdictCfg.label}</div>
                    <div className="text-sm text-muted-foreground">Threat score {result.score}/100</div>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-background/60">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      result.verdict === "phishing" ? "bg-red-500" : result.verdict === "suspicious" ? "bg-orange-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${result.score}%` }}
                  />
                </div>
              </div>

              <Panel title={`Findings (${result.findings.length})`}>
                {result.findings.length === 0 ? (
                  <p className="flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle className="h-4 w-4" /> No phishing indicators detected.
                  </p>
                ) : (
                  <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {result.findings.map((f, i) => (
                      <li key={i} className="rounded-lg border border-white/5 bg-background/40 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{f.type}</span>
                          <SevBadge level={f.severity} />
                        </div>
                        <div className="mt-1 break-words font-mono text-[11px] text-muted-foreground">{f.detail}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              {detectedUrls.length > 0 && (
                <Panel title="Live URL Preview">
                  <div className="space-y-2">
                    {Array.from(new Set(detectedUrls)).slice(0, 3).map((url, i) => (
                      <div key={i} className="rounded-lg border border-white/5 bg-background/40 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <code className="break-all font-mono text-xs text-primary">{url}</code>
                          <button
                            onClick={() => checkLiveUrl(url)}
                            disabled={liveUrlCheck?.url === url && liveUrlCheck.status === "loading"}
                            className="rounded bg-white/5 px-2 py-1 text-[10px] font-medium transition-colors hover:bg-white/10 disabled:opacity-50"
                          >
                            Check Live
                          </button>
                        </div>
                        {liveUrlCheck?.url === url && (
                          <div className="mt-2 flex items-start gap-2 text-xs">
                            <Globe className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                            <div>
                              <span className="text-muted-foreground">Title: </span>
                              <span className={cn(
                                "font-medium",
                                liveUrlCheck.status === "error" ? "text-red-400" : "text-emerald-400"
                              )}>
                                {liveUrlCheck.title}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
            </>
          ) : (
            <Panel className="min-h-[280px]" bodyClassName="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
              <FlaskConical className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <h3 className="font-grotesk font-semibold text-muted-foreground">Awaiting Analysis</h3>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground/70">
                Fill in the email fields (or load a sample) and click Analyze to see a full breakdown.
              </p>
            </Panel>
          )}

          <Panel title="What We Check">
            <ul className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {[
                "Lookalike domains (Levenshtein)",
                "Brand impersonation",
                "URL shorteners & raw IPs",
                "Suspicious TLDs & punycode",
                "Reply-To / From mismatch",
                "Urgency & pressure language",
                "Credential-harvest phrases",
                "Live URL title fetching",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Search className="h-3 w-3 text-primary" /> {t}
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" /> Heuristic + live fetch — verdicts are guidance, not ground truth.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}