import asyncio
import random
import math
from fastapi import APIRouter
from routers.ws import manager

router = APIRouter(prefix="/assets")

# Fixed strategic locations
FACILITIES = [
    # Nuclear Power Plants
    {"name": "Kudankulam Nuclear Power Plant", "lat": 8.1678, "lon": 77.6083, "type": "nuclear_plant", "country": "IN", "details": "Largest nuclear power station in India. 2x1000 MW VVER reactors."},
    {"name": "Tarapur Atomic Power Station", "lat": 19.8294, "lon": 72.6622, "type": "nuclear_plant", "country": "IN", "details": "First commercial nuclear power station built in India."},
    {"name": "Zaporizhzhia Nuclear Power Plant", "lat": 47.5119, "lon": 34.5861, "type": "nuclear_plant", "country": "UA", "details": "Largest nuclear power plant in Europe, currently active conflict sector."},
    {"name": "Chernobyl Nuclear Power Plant", "lat": 51.3892, "lon": 30.0997, "type": "nuclear_plant", "country": "UA", "details": "Restricted Exclusion Zone. Historic disaster site."},
    {"name": "Yongbyon Nuclear Scientific Research Center", "lat": 39.7997, "lon": 125.7533, "type": "enrichment_area", "country": "KP", "details": "North Korea's primary nuclear facility, active gas-graphite reactors."},
    {"name": "Natanz Uranium Enrichment Facility", "lat": 33.7228, "lon": 51.7247, "type": "enrichment_area", "country": "IR", "details": "Iran's primary fuel enrichment plant. Heavily fortified underground cascades."},
    {"name": "Fordow Fuel Enrichment Plant", "lat": 34.2045, "lon": 50.8872, "type": "enrichment_area", "country": "IR", "details": "Deep underground enrichment facility built into a mountain base."},
    {"name": "Dimona Negev Nuclear Research Center", "lat": 31.0019, "lon": 35.1469, "type": "enrichment_area", "country": "IL", "details": "Negev desert nuclear facility, highly classified air defense bubble."},
    
    # Defense R&D facilities
    {"name": "DRDO Combat Vehicles R&D Establishment (CVRDE)", "lat": 13.1189, "lon": 80.1224, "type": "defense_rd", "country": "IN", "details": "Development of armored vehicles, main battle tanks (Arjun), and tracked systems."},
    {"name": "DRDO Aeronautical Development Establishment (ADE)", "lat": 12.9691, "lon": 77.6713, "type": "defense_rd", "country": "IN", "details": "Design and development of UAVs, target drones, flight simulators."},
    {"name": "Los Alamos National Laboratory", "lat": 35.8756, "lon": -106.3242, "type": "defense_rd", "country": "US", "details": "Primary research facility for nuclear weapons development & advanced security systems."},
    
    # Military Manufacturing Units
    {"name": "Hindustan Aeronautics Limited (HAL) Fighter Division", "lat": 12.9694, "lon": 77.6625, "type": "manufacturing", "country": "IN", "details": "Manufacturing of LCA Tejas fighter jets, Su-30MKI assembly, and ALH helicopters."},
    {"name": "Mazagon Dock Shipbuilders Limited", "lat": 18.9667, "lon": 72.8431, "type": "manufacturing", "country": "IN", "details": "Shipyard constructing Kalvari-class submarines, Visakhapatnam-class destroyers, Nilgiri-class frigates."},
    {"name": "Bharat Dynamics Limited (Kanchanbagh)", "lat": 17.3392, "lon": 78.5083, "type": "manufacturing", "country": "IN", "details": "Production facility for Akash, Astra, and foreign-licensed anti-tank guided missiles."}
]

# Military Convoys and Supply Chains (dynamic/moving)
# Define coordinates to interpolate paths
CONVOY_PATHS = [
    {
        "name": "Supply Convoy Alpha (Northern Sector)",
        "waypoints": [[74.7973, 34.0837], [74.5, 34.2], [74.1361, 34.3644], [73.8, 34.5]],
        "speed": 0.02,
        "class": "logistics_convoy",
        "description": "Truck convoy transporting winter supplies & armor repairs to forward operational bases."
    },
    {
        "name": "Supply Convoy Beta (Eastern Ladakh Route)",
        "waypoints": [[77.5750, 34.1526], [78.1, 34.3], [78.6083, 34.0678]],
        "speed": 0.015,
        "class": "logistics_convoy",
        "description": "Heavy transport trucks carrying aviation fuel and communications gear."
    },
    {
        "name": "Suez-Red Sea Supply Line",
        "waypoints": [[32.5, 30.5], [33.8, 27.5], [37.5, 22.0], [42.5, 15.0]],
        "speed": 0.05,
        "class": "maritime_supply",
        "description": "Strategic shipping corridor connecting Mediterranean to Indo-Pacific ports."
    }
]

# Naval task groups
NAVAL_GROUPS = [
    {"name": "INS Vikramaditya Carrier Strike Group", "lat": 15.0, "lon": 70.0, "type": "aircraft_carrier", "heading": 120, "country": "IN", "details": "Modified Kiev-class aircraft carrier operating MiG-29K fighters."},
    {"name": "INS Arihant Submarine (SSBN)", "lat": 10.5, "lon": 85.0, "type": "submarine", "heading": 270, "country": "IN", "details": "Nuclear-powered ballistic missile submarine carrying K-15 Sagarika SLBMs."},
    {"name": "PLAN Shandong Carrier Strike Group", "lat": 19.5, "lon": 113.5, "type": "aircraft_carrier", "heading": 210, "country": "CN", "details": "Type 002 aircraft carrier conducting operations in South China Sea."},
    {"name": "USS Ronald Reagan (CVN-76) Task Force", "lat": 34.5, "lon": 140.5, "type": "aircraft_carrier", "heading": 90, "country": "US", "details": "Nimitz-class nuclear-powered aircraft carrier operating under 7th Fleet."},
    {"name": "PLAN Destroyer Group (Luyang III Class)", "lat": 23.5, "lon": 122.0, "type": "destroyer", "heading": 30, "country": "CN", "details": "Multiple active guided-missile destroyers operating off East Taiwan coast."},
    {"name": "INS Visakhapatnam (D66) Destroyer", "lat": 12.0, "lon": 82.0, "type": "destroyer", "heading": 180, "country": "IN", "details": "Lead ship of Visakhapatnam-class stealth guided-missile destroyers."},
    {"name": "HMS Defender (D36) Frigate Group", "lat": 44.5, "lon": 32.5, "type": "frigate", "heading": 45, "country": "GB", "details": "Type 45 guided-missile destroyer on joint Black Sea patrols."}
]

# Drones
DRONES = [
    {"name": "MQ-9B SeaGuardian UAV", "lat": 13.0827, "lon": 80.2707, "type": "drone", "speed": 180, "heading": 150, "country": "IN", "details": "High-altitude long-endurance drone monitoring Indian Ocean SLOCs."},
    {"name": "Tapas-BH-201 MALE UAV", "lat": 14.2283, "lon": 76.6214, "type": "drone", "speed": 140, "heading": 330, "country": "IN", "details": "Tactical aerial reconnaissance drone developed by DRDO."},
    {"name": "RQ-4 Global Hawk ISR", "lat": 37.5665, "lon": 126.9780, "type": "drone", "speed": 310, "heading": 180, "country": "US", "details": "Strategic surveillance drone operating over Korean Peninsula airspace."}
]

async def update_moving_assets():
    """Interpolate dynamic assets movement to show coordinates & names on the move"""
    t = 0
    while True:
        try:
            # 1. Update Naval Group Coordinates
            for group in NAVAL_GROUPS:
                rad = math.radians(group["heading"])
                # Move slightly
                group["lon"] += math.sin(rad) * 0.05
                group["lat"] += math.cos(rad) * 0.05
                # Keep in bounds
                if group["lon"] > 180: group["lon"] = -180
                if group["lon"] < -180: group["lon"] = 180
                if group["lat"] > 85: group["lat"] = -85
                if group["lat"] < -85: group["lat"] = 85
                # Drift heading slightly
                group["heading"] = (group["heading"] + random.choice([-5, 0, 5])) % 360

            # 2. Update Drone Coordinates
            for drone in DRONES:
                rad = math.radians(drone["heading"])
                # Drones move faster
                drone["lon"] += math.sin(rad) * 0.15
                drone["lat"] += math.cos(rad) * 0.15
                if drone["lon"] > 180: drone["lon"] = -180
                if drone["lon"] < -180: drone["lon"] = 180
                if drone["lat"] > 80: drone["lat"] = -80
                if drone["lat"] < -80: drone["lat"] = 80
                drone["heading"] = (drone["heading"] + random.choice([-10, 0, 10])) % 360

            # 3. Update Convoys along paths
            convoy_features = []
            for path in CONVOY_PATHS:
                pts = path["waypoints"]
                num_pts = len(pts)
                # Calculate position along path using sinusoidal cycle
                pos_idx = (t * path["speed"]) % (num_pts - 1)
                idx = int(pos_idx)
                frac = pos_idx - idx
                
                pt1 = pts[idx]
                pt2 = pts[idx + 1]
                
                # Interpolate coords
                lon = pt1[0] + (pt2[0] - pt1[0]) * frac
                lat = pt1[1] + (pt2[1] - pt1[1]) * frac
                
                convoy_features.append({
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [lon, lat]},
                    "properties": {
                        "name": path["name"],
                        "class": path["class"],
                        "description": path["description"]
                    }
                })

            # Broadcast combined asset information
            features = []
            
            # Static facilities
            for f in FACILITIES:
                features.append({
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [f["lon"], f["lat"]]},
                    "properties": {
                        "name": f["name"],
                        "type": f["type"],
                        "country": f["country"],
                        "details": f["details"],
                        "status": "OPERATIONAL"
                    }
                })
                
            # Naval groups
            for n in NAVAL_GROUPS:
                features.append({
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [n["lon"], n["lat"]]},
                    "properties": {
                        "name": n["name"],
                        "type": n["type"],
                        "country": n["country"],
                        "details": n["details"],
                        "heading": n["heading"],
                        "status": "MOVING"
                    }
                })
                
            # Drones
            for d in DRONES:
                features.append({
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [d["lon"], d["lat"]]},
                    "properties": {
                        "name": d["name"],
                        "type": d["type"],
                        "country": d["country"],
                        "details": d["details"],
                        "speed": d["speed"],
                        "heading": d["heading"],
                        "status": "IN_FLIGHT"
                    }
                })

            # Add convoys
            features.extend(convoy_features)

            await manager.broadcast({
                "type": "assets_update",
                "data": {
                    "type": "FeatureCollection",
                    "features": features
                }
            })
            
            t += 1
            await asyncio.sleep(5)  # Update every 5 seconds
        except Exception as e:
            print(f"[ASSETS] Loop error: {e}")
            await asyncio.sleep(5)

@router.get("/list")
def get_assets():
    # Simple list return
    return {"facilities": FACILITIES, "naval": NAVAL_GROUPS, "drones": DRONES}
