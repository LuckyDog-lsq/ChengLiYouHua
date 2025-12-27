from fastapi import APIRouter

from ..schemas import HealthStatus

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthStatus)
async def healthcheck() -> HealthStatus:
    return HealthStatus(service="citywalk-api", status="ok")
