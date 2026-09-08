# Product Requirements Document (PRD)

## Project: Defensive Tools Simulations (`defensive-tools-simulations`)

### 1. Vision & Purpose
A zero-mock, client-side cybersecurity defense operations platform providing security researchers, SOC analysts, and penetration testers with immediate threat intelligence, Sigma-style regex log parsing, live CVE feeds, and bitwise network calculators without cloud telemetry leaks.

### 2. Functional Requirements
- **FR-1: Live Security Intelligence Dashboard**
  - Query live CIRCL.lu CVE endpoints with timeout fallbacks.
  - Compute severity distribution metrics and temporal trending.
- **FR-2: Threat Hunting & OSINT Telemetry**
  - IP geolocation and ASN lookup via `ipapi.co`.
  - DNS resolution over HTTPS via Google Public DNS.
- **FR-3: Phishing & Malicious Artifact Analyzer**
  - Header inspection (SPF/DKIM/DMARC emulation heuristics).
  - URL domain entropy and punycode spoofing detection.
- **FR-4: Password & Cryptographic Entropy Engine**
  - Shannon entropy computation ($H = -\sum p_i \log_2 p_i$).
  - Estimated brute-force crack time across offline GPU clusters.
- **FR-5: Sigma-Style Log Analyzer**
  - Regex detection rules for SQL injection, Cross-Site Scripting, directory traversal, and brute-force patterns.
- **FR-6: Bitwise Network Subnetting Calculator**
  - IPv4 CIDR breakdown, usable host ranges, broadcast addresses, and wildcard masks.

### 3. Non-Functional Requirements
- **NFR-1: Zero Data Exfiltration:** All payload parsing, password entropy, and log analysis execute strictly client-side.
- **NFR-2: Hydration Integrity:** Next.js SSR hydration-safe architecture without server-client mismatches.
- **NFR-3: Resilience:** Circuit breaker timeouts preventing hanging external API requests.
