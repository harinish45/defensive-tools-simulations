"use client";

import { useState } from "react";
import { Shield, Info, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Simplified zxcvbn-style logic for educational purposes
const calculateStrength = (password: string) => {
  let score = 0;
  const feedback = [];
  const checks = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[^A-Za-z0-9]/.test(password),
  };

  if (checks.length) score += 20;
  else feedback.push("Use at least 12 characters.");

  if (checks.uppercase) score += 20;
  else feedback.push("Add uppercase letters.");

  if (checks.lowercase) score += 20;
  else feedback.push("Add lowercase letters.");

  if (checks.numbers) score += 20;
  else feedback.push("Add numbers.");

  if (checks.symbols) score += 20;
  else feedback.push("Add special characters.");

  // Penalty for simple patterns
  if (/^[a-zA-Z]+$/.test(password) && password.length > 0) {
    score -= 20;
    feedback.push("Avoid using only letters.");
  }
  if (/^[0-9]+$/.test(password) && password.length > 0) {
    score -= 20;
    feedback.push("Avoid using only numbers.");
  }

  // Calculate Entropy (approximate bits)
  let poolSize = 0;
  if (checks.lowercase) poolSize += 26;
  if (checks.uppercase) poolSize += 26;
  if (checks.numbers) poolSize += 10;
  if (checks.symbols) poolSize += 32;

  const entropy = password.length > 0 ? Math.floor(password.length * Math.log2(poolSize || 1)) : 0;

  // Calculate time to crack (educational approximation)
  const guessesPerSecond = 1e10; // 10 billion guesses/sec
  const secondsToCrack = poolSize > 0 ? Math.pow(poolSize, password.length) / guessesPerSecond : 0;

  let timeString = "Instantly";
  if (secondsToCrack > 60 * 60 * 24 * 365 * 1000) timeString = "Millennia";
  else if (secondsToCrack > 60 * 60 * 24 * 365 * 100) timeString = "Centuries";
  else if (secondsToCrack > 60 * 60 * 24 * 365) timeString = `${Math.floor(secondsToCrack / (60 * 60 * 24 * 365))} years`;
  else if (secondsToCrack > 60 * 60 * 24) timeString = `${Math.floor(secondsToCrack / (60 * 60 * 24))} days`;
  else if (secondsToCrack > 60 * 60) timeString = `${Math.floor(secondsToCrack / (60 * 60))} hours`;
  else if (secondsToCrack > 60) timeString = `${Math.floor(secondsToCrack / 60)} minutes`;
  else if (secondsToCrack > 1) timeString = `${Math.floor(secondsToCrack)} seconds`;

  return {
    score: Math.max(0, Math.min(100, score)),
    feedback,
    checks,
    entropy,
    timeString
  };
};

export default function PasswordAnalyzer() {
  const [password, setPassword] = useState("");

  // Calculate derivated state instead of using useEffect
  const results = calculateStrength(password);

  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-white/10";
    if (score < 40) return "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]";
    if (score < 80) return "bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]";
    return "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]";
  };

  const getStrengthText = (score: number) => {
    if (score === 0) return "Enter a password";
    if (score < 40) return "Weak";
    if (score < 80) return "Moderate";
    return "Strong";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Password Strength Analyzer</h1>
        <p className="text-muted-foreground">Educational tool demonstrating password entropy and cracking resistance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel rounded-xl p-6 border border-white/10">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Test Password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Type a password to analyze..."
                className="w-full bg-background/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Strength: {getStrengthText(results.score)}</span>
                <span className="text-sm font-mono">{results.score}/100</span>
              </div>
              <div className="h-3 w-full bg-background rounded-full overflow-hidden border border-white/5">
                <div
                  className={cn("h-full transition-all duration-500 ease-out rounded-full", getStrengthColor(results.score))}
                  style={{ width: `${Math.max(5, results.score)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-background/40 border border-white/5">
                <div className="text-sm text-muted-foreground mb-1">Estimated Time to Crack</div>
                <div className={cn("text-xl font-bold",
                  results.score < 40 ? "text-red-500" :
                  results.score < 80 ? "text-orange-500" : "text-green-500"
                )}>
                  {password ? results.timeString : "-"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">at 10B guesses/sec</div>
              </div>
              <div className="p-4 rounded-lg bg-background/40 border border-white/5">
                <div className="text-sm text-muted-foreground mb-1">Entropy</div>
                <div className="text-xl font-bold font-mono">
                  {results.entropy} <span className="text-sm font-normal text-muted-foreground">bits</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Information density</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-6 border border-white/10">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Requirements
            </h3>
            <ul className="space-y-3">
              {[
                { key: 'length', label: '12+ Characters' },
                { key: 'uppercase', label: 'Uppercase Letter' },
                { key: 'lowercase', label: 'Lowercase Letter' },
                { key: 'numbers', label: 'Number' },
                { key: 'symbols', label: 'Special Character' },
              ].map((req) => (
                <li key={req.key} className="flex items-center gap-3 text-sm">
                  <div className={cn("p-1 rounded-full",
                    results.checks[req.key as keyof typeof results.checks] ? "bg-green-500/20 text-green-500" : "bg-white/10 text-muted-foreground"
                  )}>
                    {results.checks[req.key as keyof typeof results.checks] ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  </div>
                  <span className={results.checks[req.key as keyof typeof results.checks] ? "text-foreground" : "text-muted-foreground"}>
                    {req.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {results.feedback.length > 0 && password.length > 0 && (
            <div className="glass-panel rounded-xl p-6 border border-orange-500/20 bg-orange-500/5">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-500">
                <Info className="w-4 h-4" />
                Suggestions
              </h3>
              <ul className="space-y-2">
                {results.feedback.map((item, i) => (
                  <li key={i} className="text-sm text-orange-200/80 list-disc list-inside">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
