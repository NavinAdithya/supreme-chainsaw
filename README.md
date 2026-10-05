# FraudShield 🛡️

> **Real-time AI & Heuristics-Driven Shipment Fraud Detection, TBML Prevention & Customs Compliance System**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Isolation%20Forest-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Pydantic](https://img.shields.io/badge/Validation-Pydantic%20v2-E92063?style=flat-square&logo=pydantic&logoColor=white)](https://docs.pydantic.dev/)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13%20%7C%203.14-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![License](https://img.shields.io/badge/License-Proprietary%20%7C%20All%20Rights%20Reserved-red?style=flat-square)](LICENSE)
[![Repository](https://img.shields.io/badge/GitHub-NavinAdithya%2Fsupreme--chainsaw-181717?style=flat-square&logo=github)](https://github.com/NavinAdithya/supreme-chainsaw)

---

## 📌 Table of Contents

- [Overview & Problem Statement](#-overview--problem-statement)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Fraud Scenarios & Attack Vectors Detected](#-fraud-scenarios--attack-vectors-detected)
- [Risk Scoring & Severity Tiers](#-risk-scoring--severity-tiers)
- [Interactive UI Walkthrough](#-interactive-ui-walkthrough)
- [Project Structure](#-project-structure)
- [Getting Started (Local Setup)](#-getting-started-local-setup)
- [REST API Reference & Payloads](#-rest-api-reference--payloads)
- [Environment Configuration](#-environment-configuration)

---

## 🔍 Overview & Problem Statement

Cross-border freight logistics moves trillions of dollars annually, but shipping manifests are frequently exploited by criminal syndicates and bad actors for:

1. **Trade-Based Money Laundering (TBML)**: Moving illicit capital across borders by over-invoicing worthless or low-grade commodities.
2. **Customs Duty & Tariff Evasion**: Drastically under-invoicing high-value consumer goods and electronics to dodge import taxes.
3. **Smuggling & Phantom Shipments**: Falsely misdeclaring weights, utilizing shell company consignees, or attempting to transport illicit/dual-use goods through monitored transshipment corridors.
4. **Sanctions Circumvention**: Routing freight through offshore secrecy jurisdictions funded with untraceable cryptocurrencies or anonymous payment instruments.

**FraudShield** intercepts incoming consignment manifests in real-time, executing a dual-layer evaluation pipeline that combines **unsupervised machine learning (Isolation Forest)** with **domain heuristics** (cargo valuation density, trade corridors, counterparty graph checks, and settlement mechanisms).

---

## ✨ Key Features

- **⚡ Dual-Engine Risk Scoring**: Blends statistical anomaly detection (Isolation Forest on joint log-distributions) with deterministic logistics business rules.
- **⚖️ Cargo Valuation Density Analytics ($/kg)**: Evaluates declared value per kilogram against industry benchmarks across standard commodity classes (*Electronics*, *Pharmaceuticals*, *Luxury Goods*, *Scrap Metal*, *Machinery*, *Chemicals*, etc.).
- **🌍 Sanctions & Geopolitical Corridor Screening**: Identifies trade corridors that traverse embargoed nations, conflict zones, or offshore transshipment secrecy havens.
- **💳 Payment Traceability & Entity Screening**: Detects circular counterparty loops (shipper identical to consignee across international borders), shell company patterns, and high-risk settlement methods (*Cryptocurrency*, *Anonymous Prepaid Cards*, *Third-Party Remittance*).
- **🧠 AI Explainer Dossier**: Synthesizes plain-English compliance reports detailing triggered safeguards and explicit protocol recommendations (*Supports Claude 3 & OpenAI GPT models with deterministic fallback*).
- **📊 Real-time Reviewer Intelligence Dashboard**:
  - Live KPI metric cards (Total Shipments, High-Risk Flagged, Review Backlog, Fraud Rate %, Value at Risk $).
  - Risk Severity Distribution meter.
  - 1-click simulation presets for quick demonstration of distinct fraud archetypes.
  - Slide-out **Consignment Audit Dossier** with adjudication controls (*Approve*, *Reject/Confirm Fraud*, *Escalate to Customs*).

---

## 🏗️ System Architecture

```text
                     Incoming Consignment Manifest
                     (Shipper, Consignee, Origin, Destination,
                      Cargo, Declared Value, Weight, Payment)
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │                 FraudShield Risk Engine                │
       │                                                        │
       │   ┌───────────────────────┐  ┌──────────────────────┐  │
       │   │   Domain Heuristics   │  │ Machine Learning (ML)│  │
       │   │  • Valuation Density  │  │  • Isolation Forest  │  │
       │   │  • Corridor Check     │  │  • Multi-dimensional │  │
       │   │  • Entity Screening   │  │    log-distribution  │  │
       │   │  • Payment Risk       │  │    anomaly score     │  │
       │   └───────────┬───────────┘  └──────────┬───────────┘  │
       │               │ (70% weight)            │ (30% weight) │
       │               └─────────────┬───────────┘              │
       │                             ▼                          │
       │                    Composite Risk Score                │
       │                       (0.00 to 1.00)                   │
       └─────────────────────────────┬──────────────────────────┘
                                     │
                                     ▼
       ┌────────────────────────────────────────────────────────┐
       │                Triage & Explainer Layer                │
       │                                                        │
       │   • Risk Tiering: LOW | MEDIUM | HIGH | CRITICAL       │
       │   • Protocol Advice: AUTO_APPROVE | MANUAL_REVIEW |    │
       │                      HOLD_FOR_PHYSICAL_INSPECTION      │
       │   • AI Narrative Dossier (Claude / OpenAI / Rules)     │
       └─────────────────────────────┬──────────────────────────┘
                                     │
                                     ▼
       ┌────────────────────────────────────────────────────────┐
       │             Reviewer Adjudication Dashboard            │
       │                                                        │
       │   • Real-Time Queue & Live Severity Distribution       │
       │   • Side-Drawer Audit Manifest Inspection              │
       │   • Human Analyst Adjudication: Approve / Reject /     │
       │     Escalate with Audit Trail Persistence              │
       └────────────────────────────────────────────────────────┘
```

---

## 🚨 Fraud Scenarios & Attack Vectors Detected

| Scenario Archetype | Pattern & Indicators | Engine Detection Mechanism | Severity Tier |
|---|---|---|---|
| **Trade-Based Money Laundering (TBML)** | $450,000 declared for 300kg of Scrap Metal ($1,500/kg vs $2.50/kg benchmark) via third-party remittance. | Cargo Valuation Density Over-Invoicing safeguard + Isolation Forest density outlier. | `CRITICAL` |
| **Tariff & Duty Under-Invoicing** | $4,200 declared for 2,800kg of High-End Electronics ($1.50/kg vs $120/kg benchmark) paid via Cash on Delivery. | Sub-benchmark valuation rule (< 0.2x min threshold) + high-value COD threshold check. | `HIGH` |
| **Sanctions Evasion & Corridor Risk** | High-value consignment originating in sanctioned jurisdiction (e.g. `IR`, `SY`, `RU`) settled in untraceable cryptocurrency. | High-risk jurisdiction corridor check + opaque settlement penalty. | `CRITICAL` |
| **Phantom Machinery** | Heavy industrial equipment declared at 2.1kg total gross weight ($290,000 value). | Machine Learning multi-dimensional joint log-feature anomaly + density mismatch. | `CRITICAL` |
| **Circular Shell Shipper** | Cross-border trade where Shipper entity matches Consignee entity without intermediary forwarder. | Circular identity heuristic + entity keyword screening. | `HIGH` |
| **Legitimate Commercial Freight** | $180,000 declared for 1,200kg of Electronics ($150/kg) paid via verified bank Letter of Credit. | Within benchmark boundaries + mitigating credit-backed payment factor. | `LOW` (Auto-Approved) |

---

## 🎯 Risk Scoring & Severity Tiers

The Risk Engine outputs a normalized score between `0.000` and `1.000`:

| Risk Tier | Score Range | Recommended Action | Operational Handling |
|---|---|---|---|
| 🟢 **LOW** | `0.000 - 0.299` | `AUTO_APPROVE` | Automatic green-channel clearance; zero delay at customs. |
| 🟡 **MEDIUM** | `0.300 - 0.599` | `STANDARD_DOCUMENT_CHECK` | Commercial invoice and bill of lading documentation check. |
| 🟠 **HIGH** | `0.600 - 0.849` | `MANUAL_REVIEW_REQUIRED` | Routed to human fraud analyst queue for manifest adjudication. |
| 🔴 **CRITICAL** | `0.850 - 1.000` | `HOLD_FOR_PHYSICAL_INSPECTION` | Port container hold placed immediately; customs physical inspection. |

---

## 🖥️ Interactive UI Walkthrough

The frontend is built with React 18, Vite, and custom cybersecurity-themed CSS:

1. **Unified View**: Consolidated monitoring dashboard displaying live metrics, intake form, and reviewer queue on one page.
2. **Intake & Scoring Form**:
   - **Quick Simulation Presets**: 1-click preset buttons to instantly demo *Trade-Based Money Laundering*, *Severe Under-Invoicing*, *Sanctioned Corridors*, and *Legitimate High-Tech*.
   - **Live Density Indicator**: Shows real-time declared density (`$ / kg`) with dynamic benchmark comparison tags as you type.
   - **Instant Score Card**: Real-time evaluation breakdown with animated score badge, risk factors list, and the AI Explainer briefing.
3. **Reviewer Adjudication Dashboard**:
   - **Status Tabs**: Filter between *All*, *Action Required (Flagged)*, *Approved*, *Rejected (Fraud)*, and *Escalated*.
   - **Audit Drawer**: Clicking **Inspect 🔎** opens a comprehensive consignment dossier with complete shipment details, valuation metrics, and compliance decision controls.

---

## 📁 Project Structure

```text
TechFest/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI application, CORS, endpoints & data persistence
│   │   ├── schemas.py       # Pydantic v2 data contracts (BookingRequest, ScoreResponse, etc.)
│   │   ├── risk_engine.py   # Heuristic rules, cargo density benchmarks & IsolationForest ML
│   │   ├── explainer.py     # AI Explainer generating natural language compliance reports
│   │   └── data_gen.py      # Synthetic logistics data generator with fraud archetypes
│   ├── data/
│   │   └── bookings.json    # JSON storage layer for local persistence across reloads
│   ├── .env.example         # Environment template for optional LLM keys
│   └── requirements.txt     # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BookingForm.jsx   # Shipment intake, live density & scoring feedback
│   │   │   ├── Dashboard.jsx     # Reviewer table, filters & slide-out audit dossier
│   │   │   └── StatsHeader.jsx   # Live KPI cards & risk severity distribution bar
│   │   ├── App.jsx               # Application shell, view tabs & toast system
│   │   ├── index.css             # Cyber/fintech dark theme & responsive layout
│   │   └── main.jsx              # React DOM entrypoint
│   ├── package.json              # Node dependencies
│   ├── vite.config.js            # Vite dev configuration & /api proxy to port 8000
│   └── index.html                # HTML entrypoint
└── README.md                     # Project documentation
```

---

## 🚀 Getting Started (Local Setup)

### Prerequisites

- **Python**: 3.11, 3.12, 3.13, or 3.14
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

### Step 1: Run the Backend (FastAPI)

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables (optional):
   ```bash
   cp .env.example .env
   ```

5. Launch the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

- **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### Step 2: Run the Frontend (React + Vite)

1. In a second terminal, navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```

- **FraudShield Web Application**: [http://localhost:5173](http://localhost:5173)
- API requests matching `/api/*` are automatically proxied to `http://127.0.0.1:8000` via `vite.config.js`.

---

## 📡 REST API Reference & Payloads

### 1. Health Check
`GET /api/health`
```json
{
  "status": "ok",
  "version": "0.1.0",
  "records_count": 25
}
```

---

### 2. Score a Shipment Booking
`POST /api/bookings/score`

**Request Body:**
```json
{
  "booking_id": "BK-90214",
  "shipper_name": "Apex Anonymous Forwarders",
  "consignee_name": "Universal Shell Corp",
  "origin_country": "US",
  "destination_country": "CY",
  "cargo_type": "Scrap Metal",
  "declared_value": 450000.00,
  "weight_kg": 300.0,
  "shipping_date": "2026-10-05",
  "payment_method": "Third-Party Remittance"
}
```

**Response (`ScoreResponse`):**
```json
{
  "booking_id": "BK-90214",
  "risk_score": 0.942,
  "risk_tier": "CRITICAL",
  "risk_factors": [
    "Severe Over-Invoicing: Declared $1500.00/kg for Scrap Metal (industry max: $8.00/kg). Potential Trade-Based Money Laundering (TBML).",
    "High-Risk Payment Channel: 'Third-Party Remittance' provides limited counterparty traceability.",
    "Offshore/Monitored transshipment hub involved (CY).",
    "Entity Screening: Company name matches high-risk offshore/shell pattern.",
    "Statistical Anomaly: Multi-dimensional density outlier detected by Isolation Forest."
  ],
  "explanation": "[CRITICAL ALERT - Risk Score: 0.94 | Tier: CRITICAL]\nConsignment BK-90214 from 'Apex Anonymous Forwarders' to 'Universal Shell Corp' (US -> CY) triggered multiple fraud safeguards...\n\nCargo Metrics: Declared value of $450,000.00 on 300.0kg of Scrap Metal ($1500.00/kg). Protocol Recommendation: Immediate physical container hold and cargo manifest audit required.",
  "recommended_action": "HOLD_FOR_PHYSICAL_INSPECTION"
}
```

---

### 3. List & Filter Bookings
`GET /api/bookings?skip=0&limit=50&status=FLAGGED&tier=CRITICAL&search=Scrap`

**Query Parameters:**
- `skip` *(int)*: Pagination offset.
- `limit` *(int)*: Records per page (max 200).
- `status` *(string, optional)*: Filter by `ALL`, `FLAGGED`, `APPROVED`, `REJECTED`, `ESCALATED`, or `PENDING`.
- `tier` *(string, optional)*: Filter by `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.
- `search` *(string, optional)*: Keyword query matching booking ID, shipper, consignee, or cargo.

---

### 4. Submit Analyst Adjudication
`POST /api/bookings/review`

**Request Body:**
```json
{
  "booking_id": "BK-90214",
  "reviewer_id": "Analyst-402",
  "decision": "REJECTED",
  "notes": "Verified severe over-invoicing and shell entity match. Container placed on hold."
}
```

**Response:** Returns the updated `BookingRecord` with attached review decision and `status = "REJECTED"`.

---

### 5. Get Aggregate Dashboard Statistics
`GET /api/stats`

**Response:**
```json
{
  "total_bookings": 25,
  "flagged_count": 7,
  "review_backlog": 8,
  "approved_count": 17,
  "rejected_count": 1,
  "escalated_count": 0,
  "fraud_rate": 32.0,
  "value_at_risk": 2296224.71,
  "tier_distribution": {
    "LOW": 17,
    "MEDIUM": 1,
    "HIGH": 3,
    "CRITICAL": 4
  }
}
```

---

### 6. Seed Synthetic Shipments
`POST /api/demo/seed?count=25`

Generates and scores `count` realistic synthetic shipments containing controlled fraud archetypes, updating the live dashboard and persistent database immediately.

---

## ⚙️ Environment Configuration

Backend environment configuration is stored in `backend/.env`.

```env
# Optional: Provide API keys for enhanced LLM-generated compliance explanations
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

> **Note**: An API key is **not required**. When absent, FraudShield automatically activates its built-in rule-based intelligence narrative generator, providing comprehensive, zero-latency explanations out of the box.

---

## 🛡️ License

**Copyright © 2026 Navin Adithya. All Rights Reserved.**

This software and all associated source code, algorithms, models, and documentation are strictly **Proprietary and Confidential**. Unauthorized copying, modification, duplication, redistribution, decompilation, or sublicensing of this project in whole or in part is strictly prohibited without prior written authorization from the copyright holder. 

See the [LICENSE](LICENSE) file for complete legal terms.
