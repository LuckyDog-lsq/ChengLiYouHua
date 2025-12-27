from fastapi import APIRouter, HTTPException, Query

from .. import data
from ..schemas import Track, TrackIngestResponse

router = APIRouter(prefix="/api/tracks", tags=["tracks"])


@router.get("", response_model=list[Track])
async def list_tracks(
    user_id: str | None = Query(None, description="Filter tracks by user identity"),
) -> list[Track]:
    """Return recent sample tracks, optionally filtered by user."""

    if user_id:
        return [track for track in data.TRACKS if track.user_id == user_id]
    return data.TRACKS


@router.post("", response_model=TrackIngestResponse, status_code=202)
async def ingest_track(
    track: Track,
    user_id: str | None = Query(
        None, description="User identity of the uploader. Must match payload when provided."
    ),
) -> TrackIngestResponse:
    """Accept a track payload. In production this would persist to PostGIS."""

    if user_id and track.user_id != user_id:
        raise HTTPException(
            status_code=400,
            detail="User identity in query does not match the payload",
        )

    data.TRACKS.append(track)
    return TrackIngestResponse(
        received_points=len(track.points),
        message=f"Track accepted for {track.user_id}",
        user_id=track.user_id,
    )
