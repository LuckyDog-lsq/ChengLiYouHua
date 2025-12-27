from fastapi import APIRouter, HTTPException

from .. import data
from ..schemas import ContentPoint

router = APIRouter(prefix="/api/content-points", tags=["content"])


@router.get("", response_model=list[ContentPoint])
async def list_content_points() -> list[ContentPoint]:
    return data.CONTENT_POINTS


@router.get("/{point_id}", response_model=ContentPoint)
async def get_content_point(point_id: str) -> ContentPoint:
    for point in data.CONTENT_POINTS:
        if point.id == point_id:
            return point
    raise HTTPException(status_code=404, detail="Content point not found")
