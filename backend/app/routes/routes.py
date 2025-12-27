from fastapi import APIRouter, HTTPException

from .. import data
from ..schemas import CityRoute

router = APIRouter(prefix="/api/routes", tags=["routes"])


@router.get("", response_model=list[CityRoute])
async def list_routes() -> list[CityRoute]:
    return data.ROUTES


@router.get("/{route_id}", response_model=CityRoute)
async def get_route(route_id: str) -> CityRoute:
    for route in data.ROUTES:
        if route.id == route_id:
            return route
    raise HTTPException(status_code=404, detail="Route not found")
