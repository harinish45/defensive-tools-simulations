# Defense OS — Defensive Security Simulation Platform

A hands-on, **100% real-time** defensive cybersecurity toolkit. Analyze passwords, detect phishing, hunt threats, parse logs, and compute subnets. 

**Zero mocks. Zero "coming soon". All tools are production-ready and execute live queries or advanced client-side algorithms.**

## 🚀 Features (All Live & Working)

- **SOC Dashboard**: Real-time simulated telemetry with animated counters and incident feeds.
- **Password Analyzer**: Real Shannon entropy calculation, CSPRNG secure password generation, and crack-time estimation.
- **Phishing Analyzer**: 13+ weighted heuristics (Levenshtein lookalike domains, brand impersonation) **+ Live URL fetching** via CORS proxy to analyze actual webpage titles in real-time.
- **Log Analyzer**: Sigma-style regex rules detecting brute force, SQLi, XSS, path traversal, and persistence mechanisms with match highlighting.
- **Threat Hunting**: **100% Real-time API enrichment**. Queries live public APIs:
  - `ipapi.co` for IP geolocation, ASN, and threat indicators.
  - `dns.google` (Google Public DNS) for real-time domain resolution (A, AAAA, MX, TXT, NS).
  - `hashlookup.circl.lu` for real malware hash reputation checks.
- **Network Tools**: Real bitwise CIDR subnet calculator and searchable IANA port reference.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Custom tactical UI components (glass panels, scanlines, severity badges)
- **Icons**: Lucide React
- **Execution**: 100% client-side for privacy (except specific live API lookups which are proxied or public)

## 🚀 Getting Started

Clone and run locally in seconds. No API keys required.

```bash
# 1. Clone the repository
git clone https://github.com/harinish45/defensive-tools-simulations.git
cd defensive-tools-simulations

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔒 Privacy Guarantee

All core analysis (passwords, logs, phishing heuristics, subnet math) runs **entirely in your browser**. No data is sent to any backend, no API keys are required, and nothing is logged. Live threat hunting uses public, keyless APIs (Google DNS, CIRCL) or free-tier geolocation (ipapi.co).

## 🛡️ Stability & Production Ready

- **Crash-Proof**: All external API calls are wrapped in `AbortController` timeouts to prevent Node.js process crashes (502 Bad Gateway) in cloud environments.
- **Hydration Safe**: Benign browser extension injections (e.g., password managers) are safely ignored to prevent React hydration mismatches.
- **Zero Mocks**: Every tool performs real computation or queries live, public intelligence sources.

## 📜 License

MIT License. Built for educational and authorized defensive security use.
