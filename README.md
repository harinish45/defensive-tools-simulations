# 🛡️ Defense OS — Defensive Security Simulation Platform

A hands-on, production-grade defensive cybersecurity toolkit built for Blue Teams, SOC analysts, and security enthusiasts. Analyze passwords, detect phishing, hunt threats, parse logs, and compute subnets — **100% client-side, zero mocks, runs fully on localhost.**

![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🚀 Features

### 🔍 Threat Hunting (Live API)
- **Real-time IP Intelligence**: Queries live geolocation, ASN, and threat indicators (TOR, Proxy, Known Attacker) via `ipapi.co`.
- **Live DNS Resolution**: Fetches real-time A, AAAA, MX, TXT, and NS records via Google Public DNS.
- **Crash-Proof Architecture**: All external requests are wrapped in timeout-protected utilities to prevent server hangs or 502 Bad Gateway errors.

### 🎣 Phishing Analyzer (Heuristic + Live Fetch)
- **Advanced Heuristics**: Detects urgency/fear-based language, URL shorteners, and brand impersonation.
- **Live URL Verification**: Safely fetches the actual webpage title of suspicious links via a CORS proxy to reveal the true destination.
- **Strict Resource Limits**: Caps live fetches to prevent memory exhaustion in cloud environments.

### 🔑 Password Analyzer
- **Shannon Entropy Calculation**: Mathematically accurate password strength scoring (`L·log₂(pool)`).
- **Crack-Time Estimation**: Calculates time-to-crack at 10K, 100B, and 10T guesses per second.
- **Pattern Detection**: Flags common substitutions, sequences, and dictionary words.
- **CSPRNG Generator**: Generates cryptographically secure, 16-character passwords instantly.

### 📜 Log Analyzer
- **Sigma-Style Regex Rules**: Detects brute force attempts, SQL injection, XSS, path traversal, and reverse shell patterns (`curl | sh`).
- **Match Highlighting**: Visually highlights malicious payloads within raw log lines.

### 🌐 Network Tools
- **Bitwise CIDR Calculator**: Accurately computes network address, broadcast address, and usable host count for any IPv4 subnet.
- **Port Reference**: Searchable database of common ports and their security implications.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Styling**: Tailwind CSS 4, `class-variance-authority`, `framer-motion`
- **Icons**: Lucide React
- **Testing**: Vitest, React Testing Library
- **Architecture**: 100% Client-Side Execution (No backend database required)

---

## 📦 Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm, yarn, pnpm, or bun

### Local Development
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
*(If port 3000 is busy, run `npm run dev -- -p 3001`)*

### CodeSandbox / Cloud VMs
This project is optimized for cloud environments. The `fetchWithTimeout` utility ensures that external API calls (like Threat Hunting) will gracefully fail with a UI error message instead of crashing the Node.js process with a `502 Bad Gateway`.

---

## 🛡️ Architecture & Security Guarantees

1. **Zero Mocks, 100% Real**: Threat intelligence and DNS queries hit live, public APIs. No simulated data.
2. **Crash-Proof Network Layer**: Every `fetch` request uses an `AbortController` with a strict 4-5 second timeout. This prevents hanging promises from taking down the Next.js server.
3. **Privacy First**: All password analysis, log parsing, and subnet calculations run **entirely in the browser**. No data is ever sent to a backend server.
4. **Hydration Safe**: The layout is configured with `suppressHydrationWarning` to safely ignore benign DOM injections from browser extensions (e.g., password managers, translators) without triggering React hydration mismatches.

---

## 📂 Project Structure

```text
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with hydration safety
│   │   ├── page.tsx            # SOC Dashboard
│   │   ├── threat-hunting/     # Live IP/Domain intelligence
│   │   ├── phishing-analyzer/  # Heuristic + live URL analysis
│   │   ├── password-analyzer/  # Entropy & crack-time calculator
│   │   ├── log-analyzer/       # Sigma-style regex log parsing
│   │   └── network-tools/      # CIDR calculator & port reference
│   ├── components/
│   │   └── layout/             # Sidebar, Header, UI primitives
│   └── lib/
│       └── api-utils.ts        # Crash-proof fetch wrapper with AbortController
├── next.config.ts              # Optimized for cloud VMs + security headers
├── tailwind.config.ts
└── package.json
```

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

> **Disclaimer**: This toolkit is designed for **educational purposes and authorized defensive security operations only**. Do not use these tools to scan or analyze systems you do not own or have explicit permission to test.