from fastapi import APIRouter

router = APIRouter(prefix="/geoint")

@router.get("/sentinel_metadata")
def get_sentinel():
    return {"status": "Sentinel-2 stub"}

@router.get("/orbital_pass")
def get_orbit():
    return {"status": "Orbital pass predictor stub using skyfield"}
