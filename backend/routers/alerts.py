"""
Alerts Router — Emergency squawk catcher, geofence breaches, ghost vessel alerter
Aggregates high-priority alerts from all data sources
"""
import asyncio
from datetime import datetime
from fastapi import APIRouter
from routers.ws import manager

router = APIRouter(prefix="/alerts")

# Alert store — ring buffer of last 100 alerts
alert_log = []
MAX_ALERTS = 100

EMERGENCY_SQUAWKS = {
    "7700": "EMERGENCY — General Emergency",
    "7600": "COMM LOSS — Radio Failure",
    "7500": "HIJACK — Unlawful Interference",
    "7777": "MILITARY INTERCEPT",
}

# Strategic chokepoints to monitor
CHOKEPOINTS = [
    {"name": "Strait of Hormuz", "lon": 56.5, "lat": 26.5, "radius_nm": 50},
    {"name": "Strait of Malacca", "lon": 103.8, "lat": 1.2, "radius_nm": 60},
    {"name": "Suez Canal", "lon": 32.5, "lat": 30.5, "radius_nm": 30},
    {"name": "Taiwan Strait", "lon": 120.0, "lat": 23.5, "radius_nm": 80},
    {"name": "Black Sea Straits", "lon": 29.1, "lat": 41.0, "radius_nm": 40},
    {"name": "Bab el-Mandeb", "lon": 43.5, "lat": 12.5, "radius_nm": 40},
    {"name": "Strait of Gibraltar", "lon": -5.3, "lat": 36.0, "radius_nm": 30},
    {"name": "GIUK Gap", "lon": -20.0, "lat": 64.0, "radius_nm": 150},
    {"name": "South China Sea", "lon": 114.0, "lat": 12.0, "radius_nm": 200},
    {"name": "Persian Gulf", "lon": 51.0, "lat": 26.0, "radius_nm": 100},
]

def add_alert(alert_type: str, severity: str, message: str, lat=None, lon=None, source=None):
    alert = {
        "id": len(alert_log),
        "type": alert_type,
        "severity": severity,  # "CRITICAL", "HIGH", "MEDIUM", "LOW"
        "message": message,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "lat": lat,
        "lon": lon,
        "source": source,
        "acknowledged": False
    }
    alert_log.insert(0, alert)
    if len(alert_log) > MAX_ALERTS:
        alert_log.pop()
    return alert


async def process_adsb_alert(aircraft: dict):
    """Check inbound aircraft data for alert conditions"""
    alerts_to_send = []
    
    squawk = aircraft.get("squawk", "")
    if squawk in EMERGENCY_SQUAWKS:
        msg = f"{EMERGENCY_SQUAWKS[squawk]} | ACFT: {aircraft.get('flight', aircraft.get('hex', 'UNK'))}"
        alert = add_alert("SQUAWK_EMERGENCY", "CRITICAL", msg,
                         lat=aircraft.get("lat"), lon=aircraft.get("lon"),
                         source="ADS-B")
        alerts_to_send.append(alert)
    
    return alerts_to_send


@router.get("/log")
def get_alerts():
    return alert_log

@router.get("/chokepoints")
def get_chokepoints():
    return CHOKEPOINTS

@router.get("/status")
def status():
    return {"total_alerts": len(alert_log), "unacknowledged": sum(1 for a in alert_log if not a["acknowledged"])}
