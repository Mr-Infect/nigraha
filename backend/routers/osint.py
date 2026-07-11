from fastapi import APIRouter

router = APIRouter(prefix="/osint")

@router.get("/gdelt")
def get_gdelt_events():
    return {"status": "GDELT stub"}

@router.get("/conflict_events")
def get_conflict_events():
    return [
        {"id": 1, "type": "Drone Strike", "location": [36.0, 49.0], "description": "[STUB] Reported explosion"}
    ]
