"use client";

import { useMemo, useState } from "react";
import {
  Lock,
  Shield,
  Info,
  Check,
  X,
  RefreshCw,
  Copy,
  CheckCircle,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Corners, PageHeader, Panel } from "@/components/ui/kit";

/* ------------------------------------------------------------------ */
/*  Real password analysis engine (entropy + pattern detection)        */
/* ------------------------------------------------------------------ */

const COMMON = new Set([
  "password", "123456", "12345678", "qwerty", "abc123", "letmein", "admin", "welcome",
  "monkey", "dragon", "111111", "iloveyou", "sunshine", "princess", "football", "charlie",
  "shadow", "superman", "batman", "trustno1", "freedom", "whatever", "passw0rd", "p@ssw0rd",
  "password1", "123456789", "1234567890", "baseball", "michael", "master", "hello",
]);
const COMMON_PREFIX = ["password", "qwerty", "admin", "letmein", "welcome", "dragon", "monkey"];
const KEYBOARD = ["qwer", "asdf", "zxcv", "qazwsx", "wasd"];
const SEQUENCES = ["0123", "1234", "2345", "3456", "4567", "5678", "6789", "abcd", "bcde", "cdef"];

type Checks = {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
};

type Analysis = {
  score: number;
  label: string;
  entropy: number;
  checks: Checks;
  feedback: string[];
  crack: { online: string; offlineFast: string; offlineSlow: string };
};

function humanTime(seconds: number): string {
  if (!isFinite(seconds) || seconds > 3.15e16) return "heat death of the universe";
  if (seconds < 1) return "instantly";
  const units: [number, string][] = [
    [3.15e13, "trillion years"],
    [3.15e10, "billion years"],
    [3.15e7, "million years"],
    [31557600, "years"],
    [2629800, "months"],
    [86400, "days"],
    [3600, "hours"],
    [60, "minutes"],
  ];
  for (const [secs, name] of units) {
    if (seconds >= secs) {
      const v = seconds / secs;
      return `${v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, "")} ${name}`;
    }
  }
  return `${Math.round(seconds)} seconds`;
}

function analyze(password: string): Analysis {
  const checks: Checks = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[^A-Za-z0-9]/.test(password),
  };

  if (!password) {
    return {
      score: 0,
      label: "Enter a password",
      entropy: 0,
      checks,
      feedback: [],
      crack: { online: "—", offlineFast: "—", offlineSlow: "—" },
    };
  }

  const lower = password.toLowerCase();
  const pool =
    (checks.lowercase ? 26 : 0) +
    (checks.uppercase ? 26 : 0) +
    (checks.numbers ? 10 : 0) +
    (checks.symbols ? 33 : 0);
  const entropy = pool > 0 ? password.length * Math.log2(pool) : 0;

  let score = entropy * 1.4;
  const feedback: string[] = [];

  if (COMMON.has(lower)) {
    score -= 40;
    feedback.push("This is one of the most common passwords — it will be guessed first.");
  } else if (COMMON_PREFIX.some((p) => lower.startsWith(p))) {
    score -= 20;
    feedback.push("Avoid building on common words like \u201Cpassword\u201D or \u201Cadmin\u201D.");
  }
  if (KEYBOARD.some((k) => lower.includes(k))) {
    score -= 15;
    feedback.push("Keyboard walks (\u201Cqwer\u201D, \u201Casdf\u201D) are trivially predictable.");
  }
  if (SEQUENCES.some((s) => lower.includes(s))) {
    score -= 10;
    feedback.push("Sequential characters (\u201C1234\u201D, \u201Cabcd\u201D) weaken the password.");
  }
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    feedback.push("Repeated characters (\u201Caaa\u201D) reduce entropy.");
  }
  const classes = [checks.lowercase, checks.uppercase, checks.numbers, checks.symbols].filter(Boolean).length;
  if (classes === 1) {
    score -= 15;
    feedback.push("Mix uppercase, lowercase, numbers and symbols.");
  }
  if (!checks.length) feedback.push("Use at least 12 characters (longer is even better).");

  score = Math.max(0, Math.min(100, Math.round(score)));
  const label = score < 40 ? "Weak" : score < 80 ? "Moderate" : "Strong";

  const combos = Math.pow(pool || 1, password.length);
  return {
    score,
    label,
    entropy: Math.round(entropy),
    checks,
    feedback,
    crack: {
      online: humanTime(combos / 100), // throttled online attack
      offlineFast: humanTime(combos / 1e10), // MD5/NTLM on a GPU rig
      offlineSlow: humanTime(combos / 1e4), // bcrypt/argon2
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Secure generator (Web Crypto)                                      */
/* ------------------------------------------------------------------ */

const SETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digit: "0123456789",
  symbol: "!@#$%^&*()-_=+[]{};:,.<>?",
};

function securePick(str: string): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return str[buf[0] % str.length];
}

function generatePassword(length: number, opts: Record<keyof typeof SETS, boolean>): string {
  const active = (Object.keys(SETS) as (keyof typeof SETS)[]).filter((k) => opts[k]);
  if (active.length === 0) return "";
  const all = active.map((k) => SETS[k]).join("");
  const chars: string[] = active.map((k) => securePick(SETS[k])); // guarantee one of each
  while (chars.length < length) chars.push(securePick(all));
  // Fisher–Yates shuffle with crypto randomness
  for (let i = chars.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const j = buf[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.slice(0, length).join("");
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PasswordAnalyzer() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(true);
  const [copied, setCopied] = useState(false);
  const [genLen, setGenLen] = useState(16);
  const [genOpts, setGenOpts] = useState({ upper: true, lower: true, digit: true, symbol: true });

  const results = useMemo(() => analyze(password), [password]);

  const meterColor =
    !password ? "bg-white/10" : results.score < 40 ? "bg-red-500" : results.score < 80 ? "bg-orange-500" : "bg-emerald-500";
  const scoreColor =
    !password ? "text-muted-foreground" : results.score < 40 ? "text-red-400" : results.score < 80 ? "text-orange-400" : "text-emerald-400";

  const segments = 12;
  const filled = Math.round((results.score / 100) * segments);

  const handleGenerate = () => {
    setPassword(generatePassword(genLen, genOpts));
    setShow(true);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = password;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const requirements = [
    { key: "length" as const, label: "12+ characters" },
    { key: "uppercase" as const, label: "Uppercase letter" },
    { key: "lowercase" as const, label: "Lowercase letter" },
    { key: "numbers" as const, label: "Number" },
    { key: "symbols" as const, label: "Special character" },
  ];

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        icon={Lock}
        title="Password Strength Analyzer"
        desc="Measure real entropy, estimate crack time across attack scenarios, and generate cryptographically secure passwords. Everything runs locally — nothing you type leaves this page."
        badge="client-side"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Test Password" scan>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password-input" className="text-sm font-medium">
                Password
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  <RefreshCw className="h-3 w-3" /> Generate
                </button>
                {password && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                  >
                    {copied ? <CheckCircle className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <input
                id="password-input"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setCopied(false);
                }}
                placeholder="Type a password to analyze..."
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-lg border border-white/10 bg-background/50 px-4 py-3 pr-11 font-mono text-lg transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Strength meter */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className={cn("text-sm font-semibold", scoreColor)}>{`Strength: ${results.label}`}</span>
                <span className="font-mono text-sm tabular-nums text-muted-foreground">{results.score}/100</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: segments }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-2.5 flex-1 rounded-sm transition-all duration-300",
                      i < filled ? meterColor : "bg-white/8"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-white/5 bg-background/40 p-4">
                <div className="text-xs text-muted-foreground">Entropy</div>
                <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                  {results.entropy}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">bits</span>
                </div>
              </div>
              <div className="rounded-lg border border-white/5 bg-background/40 p-4">
                <div className="text-xs text-muted-foreground">Character pool</div>
                <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                  {(results.checks.lowercase ? 26 : 0) +
                    (results.checks.uppercase ? 26 : 0) +
                    (results.checks.numbers ? 10 : 0) +
                    (results.checks.symbols ? 33 : 0)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">symbols</span>
                </div>
              </div>
            </div>
          </Panel>

          {/* Crack time */}
          <Panel title="Estimated Time to Crack">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Online (throttled)", sub: "100 guesses / sec", value: results.crack.online, accent: "text-sky-300" },
                { label: "Offline (fast hash)", sub: "10B guesses / sec · GPU", value: results.crack.offlineFast, accent: "text-orange-400" },
                { label: "Offline (slow hash)", sub: "10K guesses / sec · bcrypt", value: results.crack.offlineSlow, accent: "text-emerald-400" },
              ].map((c) => (
                <div key={c.label} className="rounded-lg border border-white/5 bg-background/40 p-4">
                  <div className="text-xs font-medium">{c.label}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{c.sub}</div>
                  <div className={cn("mt-2 font-mono text-lg font-semibold leading-tight", c.accent)}>{c.value}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Estimates assume the full keyspace is searched. Real attacks also use dictionaries and leaked-password
              lookups, which defeat weak passwords far faster.
            </p>
          </Panel>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Panel title="Requirements">
            <ul className="space-y-3">
              {requirements.map((req) => {
                const ok = results.checks[req.key];
                return (
                  <li key={req.key} className="flex items-center gap-3 text-sm">
                    <span
                      className={cn(
                        "grid h-5 w-5 place-items-center rounded-full",
                        ok ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-muted-foreground"
                      )}
                    >
                      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    </span>
                    <span className={ok ? "text-foreground" : "text-muted-foreground"}>{req.label}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          {password && results.feedback.length > 0 && (
            <Panel title="Suggestions" className="border-amber-400/20 bg-amber-400/5">
              <ul className="space-y-2">
                {results.feedback.map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-amber-100/80">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                    {f}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {/* Generator */}
          <Panel title="Secure Generator">
            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Length</span>
                <span className="font-mono tabular-nums">{genLen}</span>
              </div>
              <input
                type="range"
                min={8}
                max={48}
                value={genLen}
                onChange={(e) => setGenLen(Number(e.target.value))}
                className="w-full accent-[var(--primary)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["upper", "A–Z"],
                ["lower", "a–z"],
                ["digit", "0–9"],
                ["symbol", "!@#$"],
              ] as [keyof typeof SETS, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setGenOpts((o) => ({ ...o, [key]: !o[key] }))}
                  className={cn(
                    "rounded-lg border px-3 py-2 font-mono text-xs transition-colors",
                    genOpts[key]
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-white/10 bg-white/5 text-muted-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={handleGenerate}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Zap className="h-4 w-4" /> Generate Strong Password
            </button>
            <p className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-emerald-400" /> Uses crypto.getRandomValues (CSPRNG)
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
