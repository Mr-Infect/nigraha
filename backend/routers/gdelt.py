"""
GDELT Router — Global Event database polling
Fetches conflict events, news pulse, and geopolitical event codes
No API key required (fully open)
"""
import asyncio
import httpx
from fastapi import APIRouter
from routers.ws import manager

router = APIRouter(prefix="/gdelt")

# GDELT GEO 2.0 API - last 15 minutes of geo-coded events
GDELT_GEO_URL = "https://api.gdeltproject.org/api/v2/geo/geo?query=military%20OR%20war%20OR%20strike%20OR%20conflict%20OR%20defense%20OR%20naval%20OR%20missile&mode=pointdata&maxrecords=250&format=json&timespan=60"
GDELT_DOC_URL = "https://api.gdeltproject.org/api/v2/doc/doc?query=military%20OR%20war%20OR%20strike%20OR%20defense%20OR%20navy&mode=artlist&maxrecords=25&format=json&timespan=30"

gdelt_cache = []

async def fetch_gdelt_loop():
    global gdelt_cache
    async with httpx.AsyncClient() as client:
        while True:
            try:
                # Fetch geo-referenced events
                resp = await client.get(GDELT_GEO_URL, timeout=20.0)
                if resp.status_code == 200:
                    data = resp.json()
                    features = []
                    for art in data.get("features", []):
                        props = art.get("properties", {})
                        geom = art.get("geometry", {})
                        coords = geom.get("coordinates", [])
                        if len(coords) == 2:
                            features.append({
                                "type": "Feature",
                                "geometry": {"type": "Point", "coordinates": coords},
                                "properties": {
                                    "title": props.get("name", "Unknown Event"),
                                    "url": props.get("url", ""),
                                    "tone": props.get("tone", 0),
                                    "date": props.get("seendate", ""),
                                    "domain": props.get("domain", ""),
                                }
                            })
                    
                    gdelt_cache = features
                    await manager.broadcast({
                        "type": "gdelt_events",
                        "data": {"type": "FeatureCollection", "features": features}
                    })

            except Exception as e:
                print(f"[GDELT] Error: {e}")
            
            await asyncio.sleep(300)  # Poll every 5 minutes


@router.get("/events")
def get_events():
    return {"type": "FeatureCollection", "features": gdelt_cache}

@router.get("/status")
def status():
    return {"status": "ok", "cached_events": len(gdelt_cache)}
