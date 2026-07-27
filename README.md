# 🛡️ Defensive Tools Simulations

A master-level, production-ready cybersecurity toolkit built with Next.js. This platform provides real-time security intelligence, live vulnerability tracking, and advanced defensive utilities—all running 100% client-side with zero mock data.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-cyan?style=for-the-badge&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 🚀 Features

### 📊 Real-Time Security Intelligence Dashboard
- **Live Global CVE Feed:** Connects directly to the CIRCL.lu public API to stream real-time Common Vulnerabilities and Exposures (CVEs).
- **Zero Mock Data:** All metrics, threat counts, and incident feeds are calculated from live API responses or real client-side telemetry.
- **Crash-Proof Architecture:** Utilizes `AbortController` timeouts and graceful degradation to prevent 502 Bad Gateway errors in cloud environments.

### 🛠️ Advanced Security Modules
1. **Threat Hunting:** Real-time IP geolocation and DNS record resolution using `ipapi.co` and Google Public DNS.
2. **Phishing Analyzer:** Heuristic email analysis combined with live URL title fetching via CORS proxy to detect real-time phishing campaigns.
3. **Password Analyzer:** Calculates Shannon entropy, crack times, and pattern detection using the native Web Crypto API.
4. **Log Analyzer:** Sigma-style regex engine for detecting SQLi, XSS, Brute Force, and Command Injection in raw logs.
5. **Network Tools:** Bitwise CIDR subnet calculator and searchable port reference database.
6. **Vulnerability Scanner:** Context-aware payload generation and regex-based input scanning.

---

## 🏗️ Architecture & Quality Guarantees

- **100% Real-Working:** No hardcoded arrays or "coming soon" placeholders. Every tool executes real algorithms or queries live public APIs.
- **Hydration-Safe:** Fully compliant with Next.js Server-Side Rendering (SSR). All dynamic client-side state is properly gated behind `useEffect` to prevent hydration mismatches.
- **Memory-Safe:** External API calls are wrapped in a custom `fetchWithTimeout` utility to prevent memory exhaustion and server crashes.
- **Privacy-First:** All analysis (passwords, logs, phishing heuristics) happens entirely in your browser. No data is sent to our servers.

---

## 📦 Installation & Local Setup

Get started in under 60 seconds:

```bash
# Clone the repository
git clone https://github.com/harinish45/defensive-tools-simulations.git
cd defensive-tools-simulations

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 🌐 Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/harinish45/defensive-tools-simulations)

---

## 📂 Project Structure

```text
src/
├── app/
│   ├── api/
│   │   └── cves/route.ts       # Server-side proxy for live CVE feed
│   ├── page.tsx                # Real-time Intelligence Dashboard
│   ├── threat-hunting/         # Live IP & DNS resolution
│   ├── phishing-analyzer/      # Heuristic + Live URL verification
│   ├── password-analyzer/      # Entropy & Web Crypto hashing
│   ├── log-analyzer/           # Sigma-style regex engine
│   └── network-tools/          # CIDR math & port reference
├── components/
│   └── layout/Sidebar.tsx      # Navigation with hydration-safe mobile menu
└── lib/
    └── api-utils.ts            # Crash-proof fetch wrapper with AbortController
```

---

## 🛡️ Security & Privacy

- **Client-Side Execution:** Tools like the Password Analyzer and Log Analyzer run entirely in your browser using the Web Crypto API and native JavaScript.
- **No API Keys Required:** All live features use free, public, CORS-enabled APIs (or server-side proxies).
- **No Telemetry:** We do not track your usage or collect any data.

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).

---

*Built for defenders, by defenders.*