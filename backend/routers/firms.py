import os
import httpx
import asyncio
import pandas as pd
import io
from fastapi import APIRouter
from routers.ws import manager

router = APIRouter(prefix="/firms")

# In-memory cache to avoid hitting the API too often (FIRMS limits are strict)
firms_cache = []
last_fetch = 0

async def fetch_firms_loop():
    global firms_cache, last_fetch
    api_key = os.getenv("NASA_FIRMS_MAP_KEY")
    if not api_key or api_key == "your_nasa_firms_map_key_here":
        print("No valid NASA_FIRMS_MAP_KEY found, FIRMS loop will not run.")
        return

    # Using VIIRS NO24 for global active fires
    FIRMS_URL = f"https://firms.modaps.eosdis.nasa.gov/api/country/csv/{api_key}/VIIRS_SNPP_NRT/UKR/1" # Demo: Just Ukraine for speed, or we can do area/world
    # For global, we use area/world:
    FIRMS_GLOBAL_URL = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{api_key}/VIIRS_SNPP_NRT/world/1"

    async with httpx.AsyncClient() as client:
        while True:
            try:
                # print("Fetching NASA FIRMS data...")
                response = await client.get(FIRMS_GLOBAL_URL, timeout=30.0)
                if response.status_code == 200:
                    csv_data = response.text
                    df = pd.read_csv(io.StringIO(csv_data))
                    
                    # Convert to GeoJSON FeatureCollection
                    features = []
                    for _, row in df.iterrows():
                        features.append({
                            "type": "Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": [row['longitude'], row['latitude']]
                            },
                            "properties": {
                                "bright_ti4": row.get('bright_ti4', 0),
                                "scan": row.get('scan', 0),
                                "track": row.get('track', 0),
                                "acq_time": str(row.get('acq_time', '')),
                                "confidence": row.get('confidence', 'n/a')
                            }
                        })
                    
                    firms_cache = features
                    
                    await manager.broadcast({
                        "type": "firms_update",
                        "data": {
                            "type": "FeatureCollection",
                            "features": features
                        }
                    })
            except Exception as e:
                print(f"Error fetching FIRMS: {e}")
            
            # NASA FIRMS data only updates periodically, no need to hammer it
            await asyncio.sleep(600) # Poll every 10 minutes

@router.get("/active_fires")
def get_active_fires():
    return {
        "type": "FeatureCollection",
        "features": firms_cache
    }
