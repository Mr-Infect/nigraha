<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Shield-Defense.svg/200px-Shield-Defense.svg.png" width="80" alt="Shield"/>
  <h1>N I G R A H A</h1>
  <p><b>GLOBAL INTELLIGENCE & TACTICAL C2 SYSTEM</b></p>
  <p><code>CLASSIFIED // FOR ANALYTICAL USE ONLY // OSINT</code></p>
</div>

---

## 📡 SYSTEM OVERVIEW

**NIGRAHA** is a highly advanced, web-based Command and Control (C2) tactical dashboard engineered for mass surveillance, situational awareness, and global threat monitoring. Designed with defense-grade aesthetics, it aggregates real-time intelligence across multiple domains—Air, Sea, Space, and Cyber—into a single pane of glass.

Built on high-performance WebGL mapping and utilizing NATO-standard OSIRIS-style tactical symbology, NIGRAHA provides seamless visualization of thousands of concurrent entities.

## ⚔️ CAPABILITIES & INTEL DOMAINS

### ✈️ AIR DOMAIN
* **Real-Time ADS-B Feed**: Tracks commercial and military aircraft globally.
* **Tactical Classification**: Auto-classifies entities as Civilian, Military, or Emergency.
* **Emergency Squawk Alerts**: Immediate visual cues for 7700 (Emergency), 7600 (Radio Fail), and 7500 (Hijack).

### 🚢 MARITIME DOMAIN
* **Live AIS Tracking**: Monitors naval and commercial vessels.
* **Platform Categorization**: Distinguishes Carriers, Destroyers, Submarines, and Frigates with distinct directional hull symbology.
* **Strategic Chokepoints**: Monitors critical maritime transit lanes (Hormuz, Malacca, Suez, Taiwan Strait).

### 🛰️ SPACE DOMAIN
* **Keplerian Orbital Propagation**: Real-time positional calculations for global spy satellites (Keyhole, Yaogan, Cartosat, Kosmos).
* **Ground Track Projection**: Dynamic visualization of satellite orbits with precise antimeridian split handling.

### 🌐 CYBER & STRATEGIC DOMAIN
* **Cyber Mode [HACKSYS]**: Toggles the entire C2 interface into a violet-tinted cyber warfare monitoring state. Live cyber-attack vectors and nodes.
* **Nuclear Facilities**: Tracks operational status of global reactors and enrichment facilities.
* **Military Bases & A2/AD Zones**: Plots expeditionary bases and Anti-Access/Area Denial bubbles.
* **Undersea Cables**: Maps critical global fiber-optic infrastructure.
* **SIGINT/EW Emitters**: Locates global radar and electronic warfare stations.

## 🛠️ ARCHITECTURE

* **Frontend**: React, TypeScript, Tailwind CSS, MapLibre GL JS, Zustand (State Management).
* **Backend**: FastAPI (Python), Uvicorn, WebSockets for high-frequency telemetry streaming.
* **Mapping Engine**: WebGL-accelerated vector tiles (CartoCDN Dark Matter), capable of rendering massive point clusters and animated lines without frame drops.

## 🚀 DEPLOYMENT INSTRUCTIONS

### Prerequisites
* Node.js (v18+)
* Python (3.10+)
* npm or yarn

### 1. Initialize Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Copy environment file and configure API keys
cp .env.example .env
# Start the WebSocket telemetry server
uvicorn main:app --port 8001 --reload
```

### 2. Initialize Frontend
```bash
cd frontend
npm install
# Start the tactical C2 interface
npm run dev -- --host
```
*Access the interface at `http://localhost:5173`*

## 🛡️ SECURITY & COMPLIANCE

* **Data Sources**: All data streams are entirely **OSINT (Open-Source Intelligence)**.
* **Environment Variables**: Never commit `.env` files. The `.gitignore` is pre-configured to exclude sensitive keys. Refer to the `api_keys_guide.md` (or `.env.example`) for required telemetry keys.

---
<div align="center">
  <p><code>END OF REPORT // SYSTEM SECURE</code></p>
</div>
