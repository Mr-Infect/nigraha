import os
import asyncio
import json
import websockets
from fastapi import APIRouter
from routers.ws import manager

router = APIRouter(prefix="/ais")

async def fetch_ais_loop():
    api_key = os.getenv("AISSTREAM_API_KEY")
    if not api_key or api_key == "your_aisstream_api_key_here":
        print("No valid AISSTREAM_API_KEY found, AIS loop will not run.")
        return

    # We will subscribe to a global bounding box or everything.
    # AISStream requires bounding boxes. Let's do a massive bounding box covering mostly northern hemisphere for demo, 
    # or a few key areas (Med, Black Sea, South China Sea).
    # Format: [[minLat, minLon], [maxLat, maxLon]]
    subscribe_message = {
        "APIKey": api_key,
        "BoundingBoxes": [[[-90, -180], [90, 180]]] # Global
    }

    while True:
        try:
            async with websockets.connect("wss://stream.aisstream.io/v0/stream") as websocket:
                await websocket.send(json.dumps(subscribe_message))
                print("Connected to AISStream...")
                
                # To avoid overwhelming, we'll collect ships in a batch and send every 5 seconds
                ship_batch = []
                last_send = asyncio.get_event_loop().time()

                async for message_json in websocket:
                    message = json.loads(message_json)
                    message_type = message.get("MessageType")

                    if message_type == "PositionReport":
                        report = message["Message"]["PositionReport"]
                        meta = message.get("MetaData", {})
                        
                        ship = {
                            "mmsi": report.get("UserID"),
                            "lat": report.get("Latitude"),
                            "lon": report.get("Longitude"),
                            "cog": report.get("Cog"),
                            "sog": report.get("Sog"),
                            "name": meta.get("ShipName", "UNKNOWN"),
                            "timestamp": meta.get("time_utc")
                        }
                        ship_batch.append(ship)

                    if len(ship_batch) > 50 or (asyncio.get_event_loop().time() - last_send) > 5:
                        if ship_batch:
                            await manager.broadcast({
                                "type": "ais_update",
                                "data": ship_batch
                            })
                            ship_batch = []
                        last_send = asyncio.get_event_loop().time()

        except Exception as e:
            print(f"AIS WS Error: {e}, reconnecting in 5s...")
            await asyncio.sleep(5)

@router.get("/status")
def status():
    return {"status": "AIS loop is configured"}
