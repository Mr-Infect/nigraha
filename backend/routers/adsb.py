"""
ADS-B Router — Global air traffic via OpenSky Network (free, no key required)
Returns 6000+ aircraft globally with full coverage: Asia, Americas, Africa, etc.
OpenSky API: https://opensky-network.org/apidoc/rest.html
"""
import asyncio
import httpx
from fastapi import APIRouter
from routers.ws import manager

router = APIRouter(prefix="/adsb")

# OpenSky Network - free REST API, no key needed (1 req/10s anonymous)
OPENSKY_ALL = "https://opensky-network.org/api/states/all"

# State vector indices from OpenSky API
# [icao24, callsign, origin_country, time_position, last_contact,
#  longitude, latitude, baro_altitude, on_ground, velocity,
#  true_track, vertical_rate, sensors, geo_altitude, squawk,
#  spi, position_source, category]
IDX = {
    'hex': 0, 'callsign': 1, 'country': 2, 'time_pos': 3, 'last_contact': 4,
    'lon': 5, 'lat': 6, 'baro_alt': 7, 'on_ground': 8, 'gs': 9,
    'track': 10, 'vert_rate': 11, 'sensors': 12, 'geo_alt': 13,
    'squawk': 14, 'spi': 15, 'pos_src': 16,
}

EMERGENCY_SQUAWKS = {"7500", "7600", "7700", "7777"}

# Country -> flag code for labelling
COUNTRY_FLAGS = {
    "India": "🇮🇳", "China": "🇨🇳", "Russia": "🇷🇺", "United States": "🇺🇸",
    "Germany": "🇩🇪", "France": "🇫🇷", "United Kingdom": "🇬🇧", "Japan": "🇯🇵",
    "Pakistan": "🇵🇰", "Israel": "🇮🇱", "Iran": "🇮🇷", "Turkey": "🇹🇷",
    "Saudi Arabia": "🇸🇦", "Australia": "🇦🇺", "South Korea": "🇰🇷",
}

aircraft_store: dict = {}


def parse_state(s: list) -> dict | None:
    """Convert OpenSky state vector array to aircraft dict"""
    if not s or len(s) < 17:
        return None
    lat = s[IDX['lat']]
    lon = s[IDX['lon']]
    on_ground = s[IDX['on_ground']]
    if lat is None or lon is None or on_ground:
        return None  # Skip grounded / no-position

    hex_code = (s[IDX['hex']] or '').strip()
    callsign = (s[IDX['callsign']] or '').strip()
    squawk = (s[IDX['squawk']] or '').strip()
    country = (s[IDX['country']] or '').strip()

    baro = s[IDX['baro_alt']]
    geo = s[IDX['geo_alt']]
    alt_ft = int((geo or baro or 0) * 3.28084) if (geo or baro) else None

    gs_ms = s[IDX['gs']]
    gs_kt = int(gs_ms * 1.94384) if gs_ms else None

    return {
        "hex": hex_code,
        "flight": callsign or hex_code,
        "lat": lat,
        "lon": lon,
        "alt_geom": alt_ft,
        "gs": gs_kt,
        "track": s[IDX['track']],
        "vert_rate": s[IDX['vert_rate']],
        "squawk": squawk if squawk else None,
        "emergency": squawk in EMERGENCY_SQUAWKS,
        "country": country,
        "flag": COUNTRY_FLAGS.get(country, ""),
    }


async def fetch_adsb_loop():
    global aircraft_store
    backoff = 10

    async with httpx.AsyncClient(
        timeout=25.0,
        headers={"Accept": "application/json"},
    ) as client:
        while True:
            try:
                resp = await client.get(OPENSKY_ALL)

                if resp.status_code == 429:
                    print(f"[ADS-B] Rate limited, waiting {backoff}s...")
                    await asyncio.sleep(backoff)
                    backoff = min(backoff * 2, 120)
                    continue

                if resp.status_code == 200:
                    backoff = 10  # Reset on success
                    data = resp.json()
                    states = data.get("states", []) or []

                    new_store = {}
                    for s in states:
                        ac = parse_state(s)
                        if ac:
                            new_store[ac["hex"]] = ac

                    aircraft_store = new_store

                    all_ac = list(aircraft_store.values())

                    # Build broadcast - prioritize emergency, then take everything
                    priority = [a for a in all_ac if a.get("emergency")]
                    rest = [a for a in all_ac if not a.get("emergency")]

                    # No sampling needed - OpenSky is already the complete global picture
                    # Just cap at 5000 for WebSocket performance
                    payload = (priority + rest)[:5000]

                    await manager.broadcast({
                        "type": "adsb_update",
                        "data": payload
                    })

                    print(f"[ADS-B] {len(payload)} aircraft ({len(priority)} emergency) | {len(aircraft_store)} globally")
                else:
                    print(f"[ADS-B] HTTP {resp.status_code}")

            except httpx.TimeoutException:
                print("[ADS-B] Timeout, retrying...")
            except Exception as e:
                print(f"[ADS-B] Error: {e}")

            # OpenSky free tier allows ~1 req per 10s (anonymous)
            await asyncio.sleep(15)


@router.get("/status")
def status():
    return {"status": "ADS-B loop running", "tracked": len(aircraft_store)}

@router.get("/count")
def count():
    return {"count": len(aircraft_store)}
