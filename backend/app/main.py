from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import content_points, health, routes, tracks

app = FastAPI(
    title="Citywalk Immersive Guide API",
    version="0.1.0",
    description=(
        "Location-aware citywalk API skeleton. "
        "Provides endpoints for content points, curated routes, and user tracks."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(content_points.router)
app.include_router(routes.router)
app.include_router(tracks.router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "Citywalk API is running"}
