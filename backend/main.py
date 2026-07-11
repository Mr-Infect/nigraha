import asyncio
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import ws, adsb, ais, firms, osint, geoint, rss_scraper
from routers.adsb import fetch_adsb_loop
from routers.rss_scraper import fetch_news_loop
from routers.ais import fetch_ais_loop
from routers.firms import fetch_firms_loop
from routers.gdelt import fetch_gdelt_loop
from routers.osm_military import fetch_osm_loop
from routers.satellites import fetch_tle_loop
from routers.assets import update_moving_assets
from routers.cyber import fetch_cyber_news_loop, cyber_attacks_loop
from routers import gdelt, osm_military, satellites, alerts, assets, cyber

app = FastAPI(title="NIGRAHA API", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(ws.router)
app.include_router(adsb.router)
app.include_router(ais.router)
app.include_router(firms.router)
app.include_router(gdelt.router)
app.include_router(osm_military.router)
app.include_router(satellites.router)
app.include_router(alerts.router)
app.include_router(assets.router)
app.include_router(cyber.router)
app.include_router(osint.router)
app.include_router(geoint.router)
app.include_router(rss_scraper.router)

background_tasks = set()

@app.on_event("startup")
async def startup_event():
    loops = [
        fetch_adsb_loop,
        fetch_news_loop,
        fetch_ais_loop,
        fetch_firms_loop,
        fetch_gdelt_loop,
        fetch_osm_loop,
        fetch_tle_loop,
        update_moving_assets,
        fetch_cyber_news_loop,
        cyber_attacks_loop,
    ]
    for fn in loops:
        task = asyncio.create_task(fn())
        background_tasks.add(task)
        task.add_done_callback(background_tasks.discard)
    
    print(f"[NIGRAHA] Started {len(loops)} background intelligence feeds")

@app.get("/")
def read_root():
    return {
        "message": "NIGRAHA API v2.0 — OPERATIONAL",
        "feeds": ["ADS-B", "AIS", "NASA FIRMS", "GDELT", "OSM Military", "CelesTrak TLE", "Defense News"]
    }

@app.get("/health")
def health():
    return {"status": "OPERATIONAL", "version": "2.0.0"}
