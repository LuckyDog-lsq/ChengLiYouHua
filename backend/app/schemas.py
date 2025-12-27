from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ContentPoint(BaseModel):
    """Describes a single point-of-interest or narration trigger."""

    id: str
    title: str
    category: str = Field(..., description="Topic grouping such as history or food")
    description: str
    latitude: float
    longitude: float
    geofence_radius_m: float = Field(..., description="Meters around the point to trigger playback")
    audio_url: Optional[str] = None


class RouteWaypoint(BaseModel):
    """A waypoint belonging to a curated route."""

    order: int
    latitude: float
    longitude: float
    label: Optional[str] = None
    content_point_id: Optional[str] = Field(
        None, description="Optional content point triggered when the user is near this waypoint"
    )


class CityRoute(BaseModel):
    """A Citywalk path composed of waypoints."""

    id: str
    name: str
    theme: str
    distance_km: float
    waypoints: List[RouteWaypoint]


class TrackPoint(BaseModel):
    """A single recorded coordinate with timestamp."""

    latitude: float
    longitude: float
    recorded_at: datetime


class Track(BaseModel):
    """A user's full walk track."""

    user_id: str
    points: List[TrackPoint]


class TrackIngestResponse(BaseModel):
    """Response after accepting a track payload."""

    received_points: int
    message: str
    user_id: str


class HealthStatus(BaseModel):
    service: str
    status: str
