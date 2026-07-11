<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Shield-Defense.svg/200px-Shield-Defense.svg.png" width="90" alt="NIGRAHA Shield Asset"/>
  <h1>N I G R A H A</h1>
  <p><b>SOVEREIGN MILITARY INTELLIGENCE & TACTICAL C2 SYSTEM DEMO</b></p>
  <p>
    <a href="#-architecture--tech-stack"><img src="https://img.shields.io/badge/Engine-WebGL--Accelerated-00F0FF?style=flat-square" alt="Engine"/></a>
    <a href="#-security--compliance"><img src="https://img.shields.io/badge/Classification-CLASSIFIED%20%2F%20OSINT-FFB800?style=flat-square" alt="Classification"/></a>
    <a href="#-deployment-instructions"><img src="https://img.shields.io/badge/Deployment-Air--Gapped%20Capable-FF3333?style=flat-square" alt="Deployment"/></a>
  </p>
</div>

---

## 📡 SYSTEM OVERVIEW

**NIGRAHA** (Tactical Intelligence System v2.0) is a sovereign, web-based Command and Control (C2) situational awareness platform engineered for multi-modal data ingestion, threat aggregation, and global theater mapping. 

Designed with a high-fidelity, high-density tactical cockpit, NIGRAHA processes millions of unencrypted, public, and crowdsourced telemetry data packets—transforming raw Open-Source Intelligence (**OSINT**), Electronic Intelligence (**ELINT**), and Geospatial Intelligence (**GEOINT**) into unified, actionable tactical overlays without relying on commercial or premium third-party API keys.

---

## ⚔️ MULTI-DOMAIN OPERATIONS & TELEMETRIC TARGETS

The interface natively ingests and maps real-time telemetry metrics using a 60 FPS high-velocity frame buffer optimization matrix to isolate distinct theater targets:

### ✈️ AIR DOMAIN (SIGINT / MASINT)
* **Unrestricted ADS-B Parsing:** Continuous ingestion of filterless raw transponder packets capturing military airframes, ISR platforms, and heavy logistics lifters.
* **Refueling Orbit Profiling:** Heuristic spatial script flagging aircraft maintaining tight, repeating oval vectors—instantly isolating Combat Air Patrol support wings.
* **Emergency Squawk Trap:** Immediate UI interrupts for transponder codes `7700` (Emergency), `7600` (Comms Failure), and `7500` (Hijacking).
* **Telemetry Payload Data Models:**
  ```json
  { "CallSign": "AIC101", "ICAOHex": "34190667", "Squawk": "7700", "Altitude": "36000ft", "Heading": "30°", "Status": "EMERGENCY" }

### 🚢 MARITIME DOMAIN (Naval Tracking)

* **Decentralized AIS Data Stream:** Maps global shipping arrays and military auxiliaries down to precise hull vectors.
* **"Ghost Vessel" Predictive Cones:** Algorithmic calculation caching the last known heading, drift, and Speed Over Ground (SOG) of military ships turning off their transponders near flashpoints to project probability locations.
* **Chokepoint Density Metrics:** Active telemetry boxes mapping traffic fluctuations through critical naval corridors (*Strait of Malacca, Bab el-Mandeb, Taiwan Strait, Suez Canal, Gibraltar*).

### 🛰️ SPACE DOMAIN (Orbital GEOINT)

* **Keplerian Orbital Propagation:** Real-time location rendering for global spy constellations (*Keyhole, Yaogan, Cartosat, Kosmos*) parsing public Two-Line Element (TLE) datasets.
* **Visual Denial Matrices:** Calculates exact window periods when foreign optical reconnaissance satellites pass directly over internal assets, enabling localized operational security protocols.

### 🌐 CYBER & STRATEGIC DOMAIN [HACKSYS MODE]

* **Cyber-Physical Convergence:** Toggles the interface into a violet-tinted cyber warfare monitoring node network. Links real-time network threats seamlessly on the same map canvas as physical assets.
* **Infrastructure Target Ingestion:**
```yaml
Node_ID: "B4"
Target_Host: "MTC GATEWAY SERVER"
Location: "New Delhi, India"
Subnet: "164.100.47.0/24"
Attack_State: "DDOS MITIGATION IN PROGRESS"
Severity: "ELEVATED THREAT"




---

## 🛠️ ARCHITECTURE & TECH STACK

NIGRAHA is architected to run inside strictly isolated, sandboxed environments.

```
                  ┌──────────────────────────────────────────────┐
                  │          PUBLIC OSINT INTERNET DMZ           │
                  │  (Scrapers, Telegram Engines, Live Streams)  │
                  └──────────────────────┬───────────────────────┘
                                         │
                        [ Strict Protocol Buffer Schema Validation ]
                                         ▼
    =========================== ONE-WAY DATA DIODE ===========================
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │        AIR-GAPPED SYSTEM CORE (LOCAL)        │
                  │   FastAPI Engine ➔ WebSockets ➔ Tile Server  │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │             NIGRAHA C2 INTERFACE             │
                  │      60 FPS WebGL / MapLibre / milsymbol     │
                  └──────────────────────────────────────────────┘

```

* **Frontend Framework:** React, Svelte, TypeScript, Tailwind CSS.
* **Geospatial Rendering Engine:** WebGL-accelerated **MapLibre GL JS** and **CesiumJS** (for fluid 2D flat layout and 3D terrain modeling).
* **Tactical Graphics Framework:** Custom vector SVGs generating NATO-standard **APP-6 / MIL-STD-2525D** icons on-the-fly using the open-source `milsymbol` module.
* **State & Flow Pipeline:** Zustand coupled with RxJS reactive streams to prevent main-thread locking during high-frequency telemetry storms.
* **Tile Server Core:** **Protomaps** (.pmtiles architecture) parsing spatial raster/vector maps locally to support **100% offline deployment** in field conditions.
* **Backend Ingestion Engine:** **FastAPI (Python)**, Uvicorn, Async WebSockets, Telethon / Pyrogram (Telegram Signal Extraction Core).

---

## 🚀 DEPLOYMENT INSTRUCTIONS

### Prerequisites

* Node.js (v18+)
* Python (3.10+)
* Local `.pmtiles` file for target theater map boundaries.

### 1. Initialize Ingestion Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure your air-gapped system parameters & Telegram developer credentials
cp .env.example .env
nano .env

# Spin up the asynchronous high-frequency telemetry server
uvicorn main:app --port 8001 --reload

```

### 2. Initialize Tactical C2 Interface

```bash
cd frontend
npm install
# Boot the sci-fi command deck dashboard
npm run dev -- --host

```

*Access the system local loop terminal at `http://localhost:5173*`

---

## 🛡️ CYBERSECURITY HARDENING & RE-INGESTION POLICY

Because modern open-source intelligence frameworks are highly vulnerable to **adversarial data poisoning** (hostile forces manipulating public signals to execute remote parsing exploits on C2 terminals), NIGRAHA enforces a strict **Zero-Trust Ingestion Pipeline**:

1. **Unidirectional Isolation:** Public scrapers live outside the tactical intranet core, interacting exclusively across strict hardware-defined or software-defined data diodes.
2. **Deterministic Data Structuring:** No raw HTML or executable strings can enter the database. All components are bound to rigid, schema-validated Protocol Buffer layouts. Any telemetry packet with even a single out-of-bounds byte structure is instantly dropped at the boundary.
3. **Cryptographic Signatures:** Every piece of incoming intelligence (Telegram logs, images, or flight frames) is hashed using SHA-256 upon initial entry into the ingestion layer to secure data chain-of-custody.

---
