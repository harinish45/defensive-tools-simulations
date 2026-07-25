"use client";

import { useState } from "react";
import { Mail, AlertTriangle, CheckCircle, XCircle, Search, Info, Shield, Link2, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhishingResult {
  score: number;
  verdict: "safe" | "suspicious" | "phishing";
  findings: {
    type: string;
    severity: "high" | "medium" | "low";
    description: string;
  }[];
}

const SUSPICIOUS_TLDS = [".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".buzz", ".club", ".work"];
const SHORTENERS = ["bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd", "buff.ly", "rebrand.ly"];
const URGENCY_WORDS = ["immediately", "urgent", "action required", "expires", "suspended", "verify now", "account locked", "last warning", "final notice", "act now"];
const PHISHING_PHRASES = ["wire transfer", "gift card", "reset your password", "confirm your identity", "unusual activity", "payment failed", "invoice attached", "click here to verify", "update your payment", "security alert"];

const analyzeEmail = (email: string): PhishingResult => {
  const findings: PhishingResult["findings"] = [];
  let score = 0;
  const lowerEmail = email.toLowerCase();

  // Check for suspicious TLDs
  const urlRegex = /https?:\/\/([^\s/]+)|www\.([^\s/]+)/gi;
  const urls = email.match(urlRegex) || [];
  urls.forEach((url) => {
    const domain = url.replace(/https?:\/\//, "").replace(/www\./, "").split("/")[0];
    if (SUSPICIOUS_TLDS.some((tld) => domain.endsWith(tld))) {
      score += 25;
      findings.push({ type: "Suspicious Domain", severity: "high", description: `Domain "${domain}" uses a suspicious TLD commonly associated with phishing.` });
    }
    if (SHORTENERS.some((s) => domain.includes(s))) {
      score += 20;
      findings.push({ type: "URL Shortener", severity: "high", description: `URL shortener "${domain}" detected. Attackers use these to hide malicious destinations.` });
    }
    if (domain.includes("@") || domain.includes("-login") || domain.includes("-verify") || domain.includes("-secure")) {
      score += 15;
      findings.push({ type: "Deceptive URL", severity: "medium", description: `URL "${domain}" contains deceptive patterns mimicking legitimate services.` });
    }
  });

  // Check for urgency language
  URGENCY_WORDS.forEach((word) => {
    if (lowerEmail.includes(word)) {
      score += 10;
      findings.push({ type: "Urgency Language", severity: "medium", description: `Phrase "${word}" creates artificial urgency to pressure victims into acting quickly.` });
    }
  });

  // Check for phishing phrases
  PHISHING_PHRASES.forEach((phrase) => {
    if (lowerEmail.includes(phrase)) {
      score += 15;
      findings.push({ type: "Phishing Phrase", severity: "high", description: `Phrase "${phrase}" is commonly used in phishing attacks to steal credentials or money.` });
    }
  });

  // Check for excessive punctuation/caps
  if ((email.match(/!/g) || []).length > 3) {
    score += 10;
    findings.push({ type: "Excessive Punctuation", severity: "low", description: "Multiple exclamation marks detected. Legitimate organizations rarely use excessive punctuation." });
  }
  if ((email.match(/[A-Z]{5,}/g) || []).length > 2) {
    score += 10;
    findings.push({ type: "Excessive Caps", severity: "low", description: "Multiple ALL-CAPS words detected, a common tactic to create urgency." });
  }

  // Check for sender mismatch patterns
  const fromMatch = email.match(/from:\s*([\w.]+)\s*<([^>]+)>/i);
  if (fromMatch) {
    const displayName = fromMatch[1].toLowerCase();
    const emailAddr = fromMatch[2].toLowerCase();
    const emailDomain = emailAddr.split("@")[1] || "";
    if (displayName && emailDomain && !emailDomain.includes(displayName) && !displayName.includes(emailDomain.split(".")[0])) {
      score += 20;
      findings.push({ type: "Sender Mismatch", severity: "high", description: `Display name "${fromMatch[1]}" doesn't match email domain "${emailDomain}". This is a classic spoofing technique.` });
    }
  }

  // Check for attachment mentions
  if (lowerEmail.includes(".exe") || lowerEmail.includes(".zip") || lowerEmail.includes("attachment") || lowerEmail.includes("download")) {
    score += 15;
    findings.push({ type: "Suspicious Attachment", severity: "medium", description: "References to attachments or downloads detected. Phishing emails often deliver malware this way." });
  }

  // Determine verdict
  const verdict: PhishingResult["verdict"] = score >= 50 ? "phishing" : score >= 20 ? "suspicious" : "safe";

  return { score: Math.min(100, score), verdict, findings };
};

const SAMPLE_PHISHING = `From: PayPal Security <security@paypal-verify-alert.tk>
Subject: URGENT: Your account has been suspended!

Dear Customer,

We detected unusual activity on your account. You must verify your identity IMMEDIATELY or your account will be permanently locked.

Click here to verify: http://bit.ly/paypal-secure-login

This is your FINAL WARNING. Act now to avoid account suspension.

Please update your payment information and reset your password.

Regards,
PayPal Security Team`;

const SAMPLE_SAFE = `From: GitHub <noreply@github.com>
Subject: [GitHub] Your weekly digest

Hi there,

Here's your weekly activity summary:
- 3 repositories updated
- 2 pull requests merged
- 1 new follower

View your dashboard at https://github.com/dashboard

Thanks,
The GitHub Team`;

export default function PhishingAnalyzer() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<PhishingResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    if (!email.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setResult(analyzeEmail(email));
      setIsAnalyzing(false);
    }, 1200);
  };

  const getVerdictConfig = (verdict: string) => {
    switch (verdict) {
      case "phishing": return { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10 border-red-500/30", label: "Likely Phishing" };
      case "suspicious": return { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/30", label: "Suspicious" };
      default: return { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10 border-green-500/30", label: "Likely Safe" };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Mail className="w-7 h-7 text-primary" />
          Phishing Email Analyzer
        </h1>
        <p className="text-muted-foreground">Paste an email to detect phishing indicators, suspicious links, and social engineering tactics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                Email Input
              </h3>
              <div className="flex gap-2">
                <button onClick={() => { setEmail(SAMPLE_PHISHING); setResult(null); }} className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                  Load Phishing Sample
                </button>
                <button onClick={() => { setEmail(SAMPLE_SAFE); setResult(null); }} className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors">
                  Load Safe Sample
                </button>
              </div>
            </div>
            <textarea
              value={email}
              onChange={(e) => { setEmail(e.target.value); setResult(null); }}
              placeholder="Paste the full email content here (headers, body, links...)"
              className="w-full h-64 bg-background/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
            />
            <button
              onClick={handleAnalyze}
              disabled={!email.trim() || isAnalyzing}
              className="mt-4 w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
            >
              {isAnalyzing ? (
                <><Clock className="w-4 h-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Zap className="w-4 h-4" /> Analyze Email</>
              )}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Verdict Card */}
              <div className={cn("glass-panel rounded-xl p-6 border", getVerdictConfig(result.verdict).bg)}>
                <div className="flex items-center gap-4">
                  {(() => { const { icon: Icon, color } = getVerdictConfig(result.verdict); return <Icon className={cn("w-10 h-10", color)} />; })()}
                  <div>
                    <h3 className={cn("text-xl font-bold", getVerdictConfig(result.verdict).color)}>
                      {getVerdictConfig(result.verdict).label}
                    </h3>
                    <p className="text-sm text-muted-foreground">Threat Score: {result.score}/100</p>
                  </div>
                </div>
                <div className="mt-4 h-2 w-full bg-background rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700",
                      result.verdict === "phishing" ? "bg-red-500" : result.verdict === "suspicious" ? "bg-orange-500" : "bg-green-500"
                    )}
                    style={{ width: `${result.score}%` }}
                  />
                </div>
              </div>

              {/* Findings */}
              <div className="glass-panel rounded-xl p-6 border border-white/10">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-primary" />
                  Findings ({result.findings.length})
                </h3>
                {result.findings.length === 0 ? (
                  <p className="text-sm text-green-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> No phishing indicators detected.
                  </p>
                ) : (
                  <ul className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {result.findings.map((finding, i) => (
                      <li key={i} className="p-3 rounded-lg bg-background/40 border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("text-xs px-2 py-0.5 rounded font-medium",
                            finding.severity === "high" ? "bg-red-500/20 text-red-400" :
                            finding.severity === "medium" ? "bg-orange-500/20 text-orange-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          )}>
                            {finding.severity.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium">{finding.type}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{finding.description}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className="glass-panel rounded-xl p-12 border border-white/10 flex flex-col items-center justify-center text-center">
              <Shield className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-muted-foreground">No Analysis Yet</h3>
              <p className="text-sm text-muted-foreground/70 mt-2 max-w-xs">
                Paste an email on the left and click "Analyze Email" to detect phishing indicators.
              </p>
            </div>
          )}

          {/* Educational Tips */}
          <div className="glass-panel rounded-xl p-6 border border-white/10">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              What We Check
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Link2 className="w-3 h-3 text-primary" /> Suspicious domains & URL shorteners</li>
              <li className="flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-primary" /> Urgency & pressure language</li>
              <li className="flex items-center gap-2"><Mail className="w-3 h-3 text-primary" /> Sender display name mismatch</li>
              <li className="flex items-center gap-2"><Shield className="w-3 h-3 text-primary" /> Known phishing phrases & patterns</li>
              <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-primary" /> Suspicious attachments & downloads</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
