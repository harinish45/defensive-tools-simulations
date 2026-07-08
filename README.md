# CyberVerse - Educational Cybersecurity Demo Platform

A comprehensive, modular cybersecurity education platform featuring multiple security simulators, visualizations, and learning modules.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for local development)

### Running with Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd cyberverse

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Local Development

```bash
# Install backend dependencies
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Install frontend dependencies (in another terminal)
cd frontend
npm install
npm run dev
```

## 📦 Modules

### 1. Firewall Simulator
Educational firewall rule creation and traffic visualization.

### 2. Authentication Attack Simulator
Demonstrate password security, rate limiting, and MFA protection.

### 3. Keylogger Detection
Simulated malware detection and behavioral analysis.

### 4. Quiz Platform
Multi-level cybersecurity knowledge assessment.

### 5. Threat Dashboard
Mock SIEM dashboard with alert aggregation.

### 6. Security Log Analyzer
Parse and analyze security logs for anomalies.

### 7. User Management
RBAC-based user authentication and authorization.

## 🏗️ Architecture

```
cyberverse/
├── frontend/          # Next.js + React + TailwindCSS
├── backend/           # FastAPI + Python
├── modules/           # Shared module definitions
├── shared/            # Common utilities and types
├── docker/            # Docker configurations
└── docs/              # Documentation
```

## 🔒 Security Notice

This platform is for **educational purposes only**. All simulations run in isolated environments with mock data. No real attacks, credential theft, or malicious activities are performed.

## 📝 License

MIT License
