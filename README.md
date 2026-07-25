# Defense OS — Defensive Security Simulation Platform

> A hands-on **blue-team** toolkit that runs entirely in your browser. Analyze passwords, dissect
> phishing emails, hunt threats, parse logs and compute subnets — no backend, no API keys, no data
> ever leaves your machine.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![Runs offline](https://img.shields.io/badge/runs-100%25--client--side-emerald)

---

## ✨ Why Defense OS?

Most security tools require accounts, API keys or a server. Defense OS is different: **clone it,
run one command, and every tool works immediately on `localhost`**. It is built for students,
SOC analysts and CTF players who want to *understand* defensive techniques, not just click buttons.

Every detection engine is **real** — entropy math, Levenshtein lookalike detection, regex rule
matching and bitwise CIDR arithmetic — implemented client-side so you can read, learn from and
modify all of it.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18.17+** (Node 20 LTS recommended) — [download](https://nodejs.org)
- **npm** (ships with Node) or **pnpm / yarn / bun**

### Run it

```bash
# 1. Clone the repository
git clone https://github.com/harinish45/defensive-tools-simulations.git
cd defensive-tools-simulations

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open **http://localhost:3000** — that's it. No `.env` file, no API keys, no database.

> **Tip:** If port 3000 is busy, run `npm run dev -- -p 3001` and open http://localhost:3001.

### Production build

```bash
npm run build
npm start        # serves the optimized build on http://localhost:3000
```

### Run the tests

```bash
npm test         # Vitest unit tests
```

---

## 🧰 The Tools

| Module | Route | What it does | How it works |
| --- | --- | --- | --- |
| **SOC Dashboard** | `/` | Live security-operations overview | Simulated telemetry stream, animated counters, severity distribution, boot sequence |
| **Password Analyzer** | `/password-analyzer` | Score strength & generate secure passwords | Shannon entropy (`L·log₂(pool)`), crack-time across 3 attack rates, pattern detection, CSPRNG generator |
| **Phishing Analyzer** | `/phishing-analyzer` | Detect phishing emails | 13 weighted heuristics incl. **Levenshtein** lookalike domains, brand impersonation, punycode, URL shorteners |
| **Log Analyzer** | `/log-analyzer` | Find attacks in raw logs | Sigma-style regex rule engine: brute force, SQLi, XSS, path traversal, `curl \| sh`, persistence |
| **Threat Hunting** | `/threat-hunting` | Look up indicators of compromise | Auto-detects IP/domain/hash/URL, single + bulk search against a bundled intel dataset |
| **Network Tools** | `/network-tools` | Subnet math & port reference | Real bitwise CIDR calculation + searchable database of commonly abused ports |

### Try these

- **Password:** type `password123` (Moderate) vs `Tr0ub4dor&3xYz!9` (Strong), or hit *Generate*.
- **Phishing:** click **Credential Phish** / **Lookalike Domain** / **Legitimate** samples and compare verdicts.
- **Log Analyzer:** load the **SSH brute force** sample — it flags 6 failed logins from one IP.
- **Threat Hunting:** search `203.0.113.45`, `emotet`, or paste a list in **Bulk Scan**.
- **Network Tools:** compute `192.168.1.0/24` → 254 usable hosts, or `172.16.5.130/26`.

---

## 🏗️ Architecture

```
defensive-tools-simulations/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Fonts (Space Grotesk / IBM Plex) + shell
│   │   ├── globals.css             # Design tokens, animations, scanlines
│   │   ├── page.tsx                # SOC Dashboard (live telemetry)
│   │   ├── password-analyzer/      # Entropy engine + CSPRNG generator
│   │   ├── phishing-analyzer/      # Levenshtein + heuristic scoring
│   │   ├── log-analyzer/           # Regex rule engine
│   │   ├── threat-hunting/         # IOC auto-detect + intel DB
│   │   ├── network-tools/          # CIDR math + port reference
│   │   └── not-found.tsx           # 404 page
│   ├── components/
│   │   ├── layout/                 # Sidebar + Header (live UTC clock)
│   │   └── ui/                     # kit.tsx (Panel, SevBadge, Corners…) + button
│   └── lib/
│       └── utils.ts                # cn() class helper
├── package.json
├── tailwind / postcss / tsconfig
└── vitest.config.ts
```

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · lucide-react ·
recharts · framer-motion · Vitest + Testing Library.

---

## 🎨 Design System

- **Typography:** Space Grotesk (display) · IBM Plex Sans (body) · IBM Plex Mono (data).
- **Signature details:** tactical corner brackets, scanline overlays, live status dots, animated
  count-ups and sparkline draw-in.
- **Severity palette:** consistent `critical / high / medium / low / info` colors across every tool
  via the shared `SevBadge` component.

---

## 🧪 Detection Methodology

- **Password entropy** is computed as `length × log₂(character-pool)` and converted to crack time at
  three realistic rates: throttled online (100/s), offline fast hash (10¹⁰/s, GPU) and offline slow
  hash (10⁴/s, bcrypt/argon2). Common-password, keyboard-walk, sequence and repetition penalties are
  applied on top.
- **Phishing verdicts** sum weighted heuristics; a Levenshtein distance ≤ 2 between the sender domain
  and a known brand domain flags a *lookalike* (e.g. `rnicrosoft.com`).
- **Log rules** mirror Sigma logic — the brute-force rule groups `Failed password` events by source IP
  and fires at ≥ 5 attempts; other rules are per-line regex matches with the offending span highlighted.

---

## ⚠️ Disclaimer

Defense OS is an **educational simulation**. All threat-intel indicators are **fictional** (IPs use the
RFC 5737 documentation ranges `198.51.100.0/24` and `203.0.113.0/24`; domains use reserved `.example`).
Verdicts are heuristic guidance, not ground truth. Use it to learn defensive security — **never** to
attack systems you do not own.

---

## 🛣️ Roadmap

- [ ] Phishing Trainer (interactive quiz)
- [ ] Firewall rule simulator
- [ ] PCAP / packet inspector
- [ ] Optional live threat-intel integrations (VirusTotal, AbuseIPDB) behind `.env` keys

---

## 📄 License

[MIT](./LICENSE) © 2026 harinish45. Built for learning — fork it, break it, make it yours.
