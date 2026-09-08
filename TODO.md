# Engineering Roadmap & AI Pair-Programming Tasks (TODO)

## 📌 Autonomous Vibe-Coding Checklist

### Phase 1: Threat Intelligence & Feeds
- [ ] Add CISA Known Exploited Vulnerabilities (KEV) catalog JSON feed.
- [ ] Implement local offline caching using IndexedDB for CVE searches.
- [ ] Add EPSS (Exploit Prediction Scoring System) probability badges alongside CVSS scores.

### Phase 2: Log Analysis & Detection Rules
- [ ] Add export feature for Sigma detection rules to YAML format.
- [ ] Support Apache, Nginx, AWS CloudTrail, and Syslog format automatic detection.
- [ ] Add visual timeline chart of detected malicious log events.

### Phase 3: Cryptographic & Forensic Tools
- [ ] Add file hash verification utility (SHA-256, SHA-512, MD5) via Web Crypto API with drag-and-drop file support.
- [ ] Implement JWT token decoder & signature verifier.
- [ ] Add certificate transparency (CT) log query tool.
