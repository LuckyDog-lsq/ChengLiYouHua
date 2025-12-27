"""Temporary in-memory data for the API skeleton."""

from datetime import datetime, timedelta
from typing import List

from .schemas import CityRoute, ContentPoint, RouteWaypoint, Track, TrackPoint


CONTENT_POINTS: List[ContentPoint] = [
    ContentPoint(
        id="cp-001",
        title="老城街角的咖啡馆",
        category="生活方式",
        description="一家植根在老街的独立咖啡馆，记录社区的日常。",
        latitude=31.2304,
        longitude=121.4737,
        geofence_radius_m=40,
        audio_url=None,
    ),
    ContentPoint(
        id="cp-002",
        title="里弄石库门",
        category="历史人文",
        description="典型的里弄石库门建筑，展示近代上海的居住文化。",
        latitude=31.2321,
        longitude=121.4778,
        geofence_radius_m=60,
        audio_url=None,
    ),
]

ROUTES: List[CityRoute] = [
    CityRoute(
        id="route-001",
        name="老城慢行线",
        theme="社区与历史",
        distance_km=3.2,
        waypoints=[
            RouteWaypoint(order=1, latitude=31.2304, longitude=121.4737, label="起点: 人民广场"),
            RouteWaypoint(
                order=2,
                latitude=31.2311,
                longitude=121.4759,
                label="街角咖啡",
                content_point_id="cp-001",
            ),
            RouteWaypoint(
                order=3,
                latitude=31.2321,
                longitude=121.4778,
                label="石库门里弄",
                content_point_id="cp-002",
            ),
        ],
    )
]

NOW = datetime.utcnow()

TRACKS: List[Track] = [
    Track(
        user_id="demo-user",
        points=[
            TrackPoint(latitude=31.2301, longitude=121.4731, recorded_at=NOW - timedelta(minutes=10)),
            TrackPoint(latitude=31.2308, longitude=121.4749, recorded_at=NOW - timedelta(minutes=5)),
            TrackPoint(latitude=31.2315, longitude=121.4762, recorded_at=NOW - timedelta(minutes=1)),
        ],
    )
]
