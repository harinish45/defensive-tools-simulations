# 🛡️ Defense OS - Cybersecurity Simulation Platform

An enterprise-grade defensive cybersecurity simulation and education platform built with Next.js 15. Practice threat detection, password security analysis, and phishing identification in a safe, interactive environment.

## ✨ Features

### 🔐 Password Strength Analyzer
- Real-time password strength scoring (0-100)
- Entropy calculation (bits of information)
- Estimated time-to-crack at 10 billion guesses/second
- Pattern detection (repeated chars, common passwords)
- **Secure password generator** with one-click copy
- Visual requirement checklist

### 🎣 Phishing Email Analyzer
- Detects suspicious domains and URL shorteners
- Identifies urgency/pressure language tactics
- Flags sender display name mismatches (spoofing)
- Recognizes known phishing phrases and patterns
- Detects suspicious attachment references
- Includes sample phishing & safe emails for testing

### 🔍 Threat Hunting (IOC Search)
- Search Indicators of Compromise (IOCs)
- Simulated threat intelligence database
- Supports IP, domain, hash, and URL lookups
- Severity ratings (Critical/High/Medium/Low)
- Confidence scores and source attribution
- Threat type classification

### 📊 SOC Dashboard
- Real-time security operations overview
- Network traffic visualization
- Active threat monitoring
- Recent alerts feed
- Key security metrics

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|--------|
| **Next.js 15** | React framework with App Router |
| **React 19** | UI library |
| **TypeScript** | Type safety |
| **Tailwind CSS 4** | Styling |
| **Framer Motion** | Animations |
| **Recharts** | Data visualization |
| **Lucide React** | Icons |
| **Vitest** | Testing |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/harinish45/defensive-tools-simulations.git
cd defensive-tools-simulations

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests |

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with sidebar
│   ├── page.tsx                # SOC Dashboard (home)
│   ├── globals.css             # Global styles & theme
│   ├── password-analyzer/      # Password analysis tool
│   ├── phishing-analyzer/      # Phishing detection tool
│   └── threat-hunting/         # IOC search tool
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   └── Header.tsx          # Top header bar
│   ├── dashboard/              # Dashboard widgets
│   └── ui/                     # Reusable UI components
├── lib/
│   └── utils.ts                # Utility functions
└── test/                       # Test setup
```

## 🎓 Educational Purpose

This platform is designed for **educational and training purposes only**. All threat intelligence data is simulated. The tools help security professionals and students understand:

- How password cracking works and how to create strong passwords
- Common phishing techniques and how to identify them
- Threat hunting methodologies and IOC analysis
- SOC operations and security monitoring

## ⚠️ Disclaimer

This is a simulation platform for educational use. No real threat data is processed, and no actual security scanning is performed. All data is fictional and generated for training purposes.

## 📄 License

MIT License - feel free to use this for learning and training.

## 👤 Author

**harinish45**

---

*Built with 🛡️ for the cybersecurity community*
