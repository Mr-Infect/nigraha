import asyncio
import math
import time
from fastapi import APIRouter
from routers.ws import manager

router = APIRouter(prefix="/satellites")

# Predefined Spy Satellites with Keplerian orbital parameters for propagation
# Name, Inclination (deg), Altitude (km), Period (seconds), Country, Type
SATELLITES_DB = [
    {"name": "Cartosat-2A (Spy)", "inc": 97.9, "alt": 630, "period": 5800, "country": "IN", "type": "spy"},
    {"name": "RISAT-1A (Radar)", "inc": 97.9, "alt": 529, "period": 5700, "country": "IN", "type": "radar"},
    {"name": "Cartosat-3 (High-Res)", "inc": 97.9, "alt": 509, "period": 5690, "country": "IN", "type": "spy"},
    {"name": "RISAT-2B (SAR)", "inc": 37.0, "alt": 557, "period": 5750, "country": "IN", "type": "radar"},
    
    {"name": "Yaogan-30 (ISR)", "inc": 35.0, "alt": 600, "period": 5760, "country": "CN", "type": "spy"},
    {"name": "Yaogan-35A (SAR)", "inc": 35.0, "alt": 490, "period": 5600, "country": "CN", "type": "radar"},
    {"name": "Yaogan-36B (ELINT)", "inc": 35.0, "alt": 500, "period": 5620, "country": "CN", "type": "elint"},
    
    {"name": "USA-290 (Keyhole)", "inc": 97.9, "alt": 380, "period": 5500, "country": "US", "type": "spy"},
    {"name": "USA-314 (Lacrosse)", "inc": 57.0, "alt": 670, "period": 5900, "country": "US", "type": "radar"},
    
    {"name": "Kosmos-2550 (Liana)", "inc": 67.1, "alt": 900, "period": 6100, "country": "RU", "type": "elint"},
    {"name": "Kosmos-2562 (Kondor)", "inc": 97.9, "alt": 500, "period": 5620, "country": "RU", "type": "radar"}
]

# Cache of TLEs for info endpoint
tle_cache = {}

def propagate_satellite(sat: dict, t_sec: float) -> tuple[float, float, list[list[float]]]:
    """
    Keplerian circular orbit propagator.
    Returns: (lat, lon, ground_track_coordinates)
    """
    # Orbital angular velocity (rad/s)
    w = 2 * math.pi / sat["period"]
    
    # Current mean anomaly / orbital angle
    theta = w * t_sec
    
    # Orbit inclination in radians
    inc_rad = math.radians(sat["inc"])
    
    # Current position in orbital plane coordinates
    # For a circular orbit, x = cos(theta), y = sin(theta)
    # Project to spherical coordinates
    # sin(lat) = sin(inc) * sin(theta)
    lat_rad = math.asin(math.sin(inc_rad) * math.sin(theta))
    
    # lon = R.A.A.N. + atan2(cos(inc)*sin(theta), cos(theta)) - EarthRotation
    # Let RAAN depend on satellite index to spread them out
    raan = (SATELLITES_DB.index(sat) * 35.0) % 360.0
    raan_rad = math.radians(raan)
    
    y = math.cos(inc_rad) * math.sin(theta)
    x = math.cos(theta)
    
    # Earth rotation angle in radians since epoch (simple rate: 360 deg / 86400 seconds)
    earth_rot = (t_sec * 360.0 / 86400.0) % 360.0
    earth_rot_rad = math.radians(earth_rot)
    
    lon_rad = raan_rad + math.atan2(y, x) - earth_rot_rad
    
    lat = math.degrees(lat_rad)
    lon = math.degrees(lon_rad)
    
    # Wrap lon to [-180, 180]
    lon = ((lon + 180) % 360) - 180
    
    # Calculate ground track path (one complete orbit, 48 points)
    # Split into segments at antimeridian crossings to avoid horizontal lines
    orbit_segments = []
    current_segment = []
    
    for step in range(49):
        frac = step / 48.0
        orb_angle = w * (t_sec + frac * sat["period"])
        
        step_lat_rad = math.asin(math.sin(inc_rad) * math.sin(orb_angle))
        step_y = math.cos(inc_rad) * math.sin(orb_angle)
        step_x = math.cos(orb_angle)
        step_earth_rot = ((t_sec + frac * sat["period"]) * 360.0 / 86400.0) % 360.0
        step_earth_rot_rad = math.radians(step_earth_rot)
        
        step_lon_rad = raan_rad + math.atan2(step_y, step_x) - step_earth_rot_rad
        step_lat = math.degrees(step_lat_rad)
        step_lon = math.degrees(step_lon_rad)
        step_lon = ((step_lon + 180) % 360) - 180
        
        if current_segment:
            prev_lon = current_segment[-1][0]
            # Antimeridian crossing: longitude jump > 180°
            if abs(step_lon - prev_lon) > 180:
                if len(current_segment) >= 2:
                    orbit_segments.append(current_segment)
                current_segment = []
        
        current_segment.append([step_lon, step_lat])
    
    if len(current_segment) >= 2:
        orbit_segments.append(current_segment)
    
    return lat, lon, orbit_segments

async def fetch_tle_loop():
    """Runs propagator and broadcasts live positions & orbits to manager"""
    start_time = time.time()
    while True:
        try:
            curr_sec = time.time() - start_time
            positions_features = []
            orbits_features = []
            
            for sat in SATELLITES_DB:
                lat, lon, track = propagate_satellite(sat, curr_sec)
                
                # Position point
                positions_features.append({
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [lon, lat]},
                    "properties": {
                        "name": sat["name"],
                        "country": sat["country"],
                        "type": sat["type"],
                        "altitude": sat["alt"],
                        "inclination": sat["inc"],
                        "period": sat["period"]
                    }
                })
                
                # Orbit ground track — MultiLineString to handle antimeridian splits
                orbits_features.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiLineString",
                        "coordinates": track  # list of segments, each a list of [lon,lat]
                    },
                    "properties": {
                        "name": sat["name"] + " Orbit",
                        "type": sat["type"]
                    }
                })
                
            await manager.broadcast({
                "type": "satellites_update",
                "data": {
                    "positions": {
                        "type": "FeatureCollection",
                        "features": positions_features
                    },
                    "orbits": {
                        "type": "FeatureCollection",
                        "features": orbits_features
                    }
                }
            })
        except Exception as e:
            print(f"[SATELLITES] Propagator loop error: {e}")
            
        await asyncio.sleep(5)  # Propagate and send every 5 seconds

@router.get("/status")
def status():
    return {"status": "ok", "satellites_count": len(SATELLITES_DB)}

@router.get("/list")
def get_satellites():
    return SATELLITES_DB
