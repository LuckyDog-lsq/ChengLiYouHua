export type ContentPoint = {
  id: string;
  title: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  geofence_radius_m: number;
  audio_url?: string | null;
  owner_user_id?: string | null;
  permissions?: Permission[];
};

export type RouteWaypoint = {
  order: number;
  latitude: number;
  longitude: number;
  label?: string | null;
  content_point_id?: string | null;
};

export type CityRoute = {
  id: string;
  name: string;
  theme: string;
  distance_km: number;
  waypoints: RouteWaypoint[];
  created_by?: string | null;
};

export type TrackPoint = {
  latitude: number;
  longitude: number;
  recorded_at: string;
};

export type Track = {
  user_id: string;
  points: TrackPoint[];
};

export type Permission = {
  resource: "content" | "routes" | "tracks" | "users";
  actions: ("create" | "read" | "update" | "delete" | "plan")[];
};

export type UserProfile = {
  id: string;
  display_name: string;
  role: "viewer" | "editor" | "planner" | "admin";
  permissions: Permission[];
};
