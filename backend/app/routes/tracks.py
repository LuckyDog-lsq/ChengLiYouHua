from fastapi import APIRouter

from .. import data
from ..schemas import Track, TrackIngestResponse

router = APIRouter(prefix="/api/tracks", tags=["tracks"])


@router.get("", response_model=list[Track])
async def list_tracks() -> list[Track]:
    """Return recent sample tracks. Real implementation would filter by user."""

    return data.TRACKS


@router.post("", response_model=TrackIngestResponse, status_code=202)
async def ingest_track(track: Track) -> TrackIngestResponse:
    """Accept a track payload. In production this would persist to PostGIS."""

    data.TRACKS.append(track)
    return TrackIngestResponse(
        received_points=len(track.points),
        message="Track accepted for processing",
    )
