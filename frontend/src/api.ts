import type { CityRoute, ContentPoint, Track, TrackPoint } from "./types";

const API_BASE =
  import.meta.env.VITE_API_BASE?.replace(/\/$/, "") ?? "http://localhost:8000";

async function handleResponse<T>(response: Response) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchContentPoints() {
  const response = await fetch(`${API_BASE}/api/content-points`);
  return handleResponse<ContentPoint[]>(response);
}

export async function fetchRoutes() {
  const response = await fetch(`${API_BASE}/api/routes`);
  return handleResponse<CityRoute[]>(response);
}

export async function fetchTracks() {
  const response = await fetch(`${API_BASE}/api/tracks`);
  return handleResponse<Track[]>(response);
}

export async function sendTrack(userId: string, points: TrackPoint[]) {
  const payload: Track = { user_id: userId, points };
  const response = await fetch(`${API_BASE}/api/tracks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<{ received_points: number; message: string }>(response);
}
