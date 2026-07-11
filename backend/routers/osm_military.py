"""
OSM Military Infrastructure Router
Uses Overpass API to find military installations, airfields, bunkers, bases
No API key required
"""
import asyncio
import httpx
from fastapi import APIRouter
from routers.ws import manager

router = APIRouter(prefix="/osm")

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Query for military installations globally (sampled regions to keep it manageable)
OVERPASS_QUERY = """
[out:json][timeout:60];
(
  node["military"]({{bbox}});
  way["military"]({{bbox}});
  node["landuse"="military"]({{bbox}});
  way["landuse"="military"]({{bbox}});
  node["aeroway"="aerodrome"]["military"]({{bbox}});
);
out center;
"""

# Key military regions to query
BBOXES = [
    "34,25,48,45",    # Middle East
    "46,22,58,42",    # Black Sea / Ukraine
    "3,95,25,140",    # East/SE Asia
    "35,55,55,70",    # Central Asia
    "20,-20,55,55",   # Africa
    "55,35,70,60",    # Russia
]

osm_cache = []

async def fetch_osm_loop():
    global osm_cache
    async with httpx.AsyncClient() as client:
        while True:
            all_features = []
            for bbox in BBOXES:
                try:
                    lat_min, lon_min, lat_max, lon_max = bbox.split(",")
                    query = f"""
[out:json][timeout:60];
(
  node["military"]({lat_min},{lon_min},{lat_max},{lon_max});
  way["military"]({lat_min},{lon_min},{lat_max},{lon_max});
  node["landuse"="military"]({lat_min},{lon_min},{lat_max},{lon_max});
  node["aeroway"="aerodrome"]({lat_min},{lon_min},{lat_max},{lon_max});
);
out center;
"""
                    resp = await client.post(OVERPASS_URL, data={"data": query}, timeout=60.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        for el in data.get("elements", []):
                            lat = el.get("lat") or (el.get("center", {}).get("lat"))
                            lon = el.get("lon") or (el.get("center", {}).get("lon"))
                            if lat and lon:
                                tags = el.get("tags", {})
                                mil_type = tags.get("military", tags.get("landuse", tags.get("aeroway", "facility")))
                                all_features.append({
                                    "type": "Feature",
                                    "geometry": {"type": "Point", "coordinates": [lon, lat]},
                                    "properties": {
                                        "name": tags.get("name", "Unknown Facility"),
                                        "type": mil_type,
                                        "operator": tags.get("operator", ""),
                                        "country": tags.get("addr:country", ""),
                                        "osm_id": el.get("id")
                                    }
                                })
                    await asyncio.sleep(5)  # Rate limit between bbox queries
                except Exception as e:
                    print(f"[OSM] Error on bbox {bbox}: {e}")
            
            if all_features:
                osm_cache = all_features
                await manager.broadcast({
                    "type": "osm_military",
                    "data": {"type": "FeatureCollection", "features": osm_cache}
                })
            
            await asyncio.sleep(3600)  # Refresh every hour


@router.get("/military")
def get_military():
    return {"type": "FeatureCollection", "features": osm_cache}

@router.get("/status")
def status():
    return {"status": "ok", "facilities": len(osm_cache)}
