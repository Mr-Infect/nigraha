import asyncio
import random
import feedparser
from datetime import datetime
from fastapi import APIRouter
from routers.ws import manager

router = APIRouter(prefix="/cyber")

CYBER_NEWS_RSS = [
    "https://feeds.feedburner.com/TheHackersNews",
    "https://hnrss.org/newest?q=exploit+OR+cybersecurity+OR+zero-day",
    "https://www.cisa.gov/cybersecurity-advisories.xml"
]

# Global nodes/IPs for simulated cyber attacks
CYBER_NODES = [
    {"name": "Beijing Command Center", "country": "CN", "lat": 39.9042, "lon": 116.4074, "ip": "221.228.12.94"},
    {"name": "New Delhi NIC Base", "country": "IN", "lat": 28.6139, "lon": 77.2090, "ip": "164.100.47.12"},
    {"name": "Moscow GRU Hub", "country": "RU", "lat": 55.7558, "lon": 37.6173, "ip": "95.108.142.25"},
    {"name": "Washington NSA Center", "country": "US", "lat": 38.9072, "lon": -77.0369, "ip": "40.85.145.9"},
    {"name": "Pyongyang 121 Unit", "country": "KP", "lat": 39.0392, "lon": 125.7625, "ip": "175.45.176.10"},
    {"name": "Tehran Cyber Cmd", "country": "IR", "lat": 35.6892, "lon": 51.3890, "ip": "5.250.96.22"},
    {"name": "Tel Aviv IDF Unit 8200", "country": "IL", "lat": 32.0853, "lon": 34.7818, "ip": "82.166.192.4"},
    {"name": "Taipei Security Op Center", "country": "TW", "lat": 25.0330, "lon": 121.5654, "ip": "117.56.22.42"},
    {"name": "Seoul KISA Lab", "country": "KR", "lat": 37.5665, "lon": 126.9780, "ip": "210.104.1.99"},
    {"name": "Tokyo NISC Base", "country": "JP", "lat": 35.6762, "lon": 139.6503, "ip": "202.214.86.15"}
]

ATTACK_TYPES = [
    "DDoS Flood (SYN / UDP)",
    "Zero-Day Exploit Injection",
    "SQL Injection Command Execution",
    "Ransomware Propagation (WannaCry-Variant)",
    "APT Spear-Phishing Exfiltration",
    "SCADA Control Tamper Attempt",
    "BGP Route Hijacking Route Inject"
]

cyber_news = []
cyber_attacks = []

async def fetch_cyber_news_loop():
    global cyber_news
    while True:
        try:
            news_items = []
            for url in CYBER_NEWS_RSS:
                feed = feedparser.parse(url)
                for entry in feed.entries[:8]:
                    news_items.append({
                        "title": entry.get("title", "Unknown Cyber Incident"),
                        "link": entry.get("link", ""),
                        "published": entry.get("published", datetime.utcnow().strftime("%Y-%m-%d %H:%M")),
                        "source": "CyberSec OSINT"
                    })
            if news_items:
                # Deduplicate and sort
                seen = set()
                deduped = []
                for item in news_items:
                    if item["link"] not in seen:
                        seen.add(item["link"])
                        deduped.append(item)
                cyber_news = sorted(deduped, key=lambda x: x["published"], reverse=True)[:30]
                
                await manager.broadcast({
                    "type": "cyber_news_update",
                    "data": cyber_news
                })
        except Exception as e:
            print(f"[CYBER] News fetch error: {e}")
        
        await asyncio.sleep(600)  # Every 10 minutes

async def cyber_attacks_loop():
    """Generates continuous stream of live simulated global cyber attacks"""
    while True:
        try:
            attacker = random.choice(CYBER_NODES)
            target = random.choice(CYBER_NODES)
            while target == attacker:
                target = random.choice(CYBER_NODES)
            
            attack_type = random.choice(ATTACK_TYPES)
            port = random.choice([80, 443, 22, 23, 502, 3389, 445])
            
            attack = {
                "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
                "attacker": attacker["name"],
                "attacker_ip": attacker["ip"],
                "attacker_coords": [attacker["lon"], attacker["lat"]],
                "target": target["name"],
                "target_ip": target["ip"],
                "target_coords": [target["lon"], target["lat"]],
                "type": attack_type,
                "port": port
            }
            
            # Broadcast cyber attack
            await manager.broadcast({
                "type": "cyber_attack_event",
                "data": attack
            })
            
            # Slow down / speed up randomly
            await asyncio.sleep(random.uniform(1.0, 3.5))
        except Exception as e:
            print(f"[CYBER] Attack loop error: {e}")
            await asyncio.sleep(5)

@router.get("/news")
def get_cyber_news():
    return cyber_news

@router.get("/status")
def status():
    return {"status": "Cyber engine operational", "cached_news": len(cyber_news)}
