import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import { fetchContentPoints, fetchRoutes, fetchTracks, sendTrack } from "./api";
import type { CityRoute, ContentPoint, Track } from "./types";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type FetchState<T> = {
  data: T;
  loading: boolean;
  error?: string;
};

const defaultState = {
  contentPoints: { data: [] as ContentPoint[], loading: true },
  routes: { data: [] as CityRoute[], loading: true },
  tracks: { data: [] as Track[], loading: true },
};

function SectionCard({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="card__header">
        <div>
          <h2>{title}</h2>
          {description ? <p className="muted">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="badge">{label}</span>;
}

function EmptyState({ label }: { label: string }) {
  return <p className="muted">{label}</p>;
}

function App() {
  const [contentPoints, setContentPoints] = useState<FetchState<ContentPoint[]>>(
    defaultState.contentPoints,
  );
  const [routes, setRoutes] = useState<FetchState<CityRoute[]>>(defaultState.routes);
  const [tracks, setTracks] = useState<FetchState<Track[]>>(defaultState.tracks);
  const [actionMessage, setActionMessage] = useState<string>("");
  const [userId, setUserId] = useState<string>("demo-web-user");

  useEffect(() => {
    fetchContentPoints()
      .then((points) => setContentPoints({ data: points, loading: false }))
      .catch((error) =>
        setContentPoints({ data: [], loading: false, error: error.message }),
      );

    fetchRoutes()
      .then((items) => setRoutes({ data: items, loading: false }))
      .catch((error) => setRoutes({ data: [], loading: false, error: error.message }));

  }, []);

  useEffect(() => {
    setTracks((previous) => ({ ...previous, loading: true, error: undefined }));
    fetchTracks(userId)
      .then((items) => setTracks({ data: items, loading: false }))
      .catch((error) => setTracks({ data: [], loading: false, error: error.message }));
  }, [userId]);

  const busiestRoute = useMemo(() => routes.data[0], [routes.data]);
  const activeTrack = useMemo(() => tracks.data[0], [tracks.data]);
  const mapCenter = useMemo(() => {
    if (contentPoints.data.length > 0) {
      const point = contentPoints.data[0];
      return [point.latitude, point.longitude] as [number, number];
    }
    if (busiestRoute?.waypoints.length) {
      const waypoint = busiestRoute.waypoints[0];
      return [waypoint.latitude, waypoint.longitude] as [number, number];
    }
    return [31.2304, 121.4737] as [number, number];
  }, [contentPoints.data, busiestRoute]);

  const sendMockTrack = async () => {
    if (!userId) {
      setActionMessage("请先填写登录用户");
      return;
    }
    setActionMessage("正在发送示例轨迹…");
    try {
      const now = new Date();
      const response = await sendTrack(userId, [
        { latitude: 31.2301, longitude: 121.4731, recorded_at: now.toISOString() },
        {
          latitude: 31.231,
          longitude: 121.4746,
          recorded_at: new Date(now.getTime() + 60_000).toISOString(),
        },
        {
          latitude: 31.232,
          longitude: 121.4762,
          recorded_at: new Date(now.getTime() + 120_000).toISOString(),
        },
      ]);
      setActionMessage(response.message);
      const refreshed = await fetchTracks(userId);
      setTracks({ data: refreshed, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "发送失败";
      setActionMessage(message);
    }
  };

  const hasError = contentPoints.error || routes.error || tracks.error;

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">城市慢行 / 实时触达</p>
          <h1>城市沉浸式导览</h1>
          <p className="muted">
            以位置为中心，边走边听的 Citywalk 体验。后端 API 已包含内容点、路线与轨迹的示例数据，
            便于后续接入 PostGIS 与内容管理后台。
          </p>
          <div className="pill-row">
            <Badge label="位置触发" />
            <Badge label="路线规划" />
            <Badge label="轨迹留存" />
          </div>
        </div>
        <div className="status-box">
          <p className="muted">API 连接状态</p>
          {hasError ? (
            <strong className="text-error">部分数据源加载失败</strong>
          ) : (
            <strong>正常</strong>
          )}
          <p className="muted small">默认请求 http://localhost:8000</p>
        </div>
      </header>

      <main className="grid">
        <SectionCard
          title="地图预览"
          description="叠加内容点、推荐路线与当前登录用户的轨迹。"
        >
          <div className="map-shell">
            <MapContainer center={mapCenter} zoom={14} className="map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {contentPoints.data.map((point) => (
                <Marker key={point.id} position={[point.latitude, point.longitude]}>
                  <Popup>
                    <strong>{point.title}</strong>
                    <p className="muted small">{point.description}</p>
                    <p className="muted small">
                      半径 {point.geofence_radius_m}m · {point.category}
                    </p>
                  </Popup>
                </Marker>
              ))}
              {busiestRoute?.waypoints?.length ? (
                <Polyline
                  positions={busiestRoute.waypoints.map((waypoint) => [
                    waypoint.latitude,
                    waypoint.longitude,
                  ])}
                  pathOptions={{ color: "#2563eb" }}
                />
              ) : null}
              {activeTrack?.points?.length ? (
                <Polyline
                  positions={activeTrack.points.map((point) => [
                    point.latitude,
                    point.longitude,
                  ])}
                  pathOptions={{ color: "#f97316" }}
                />
              ) : null}
            </MapContainer>
          </div>
        </SectionCard>

        <SectionCard title="内容点" description="电子围栏触发的讲解内容。">
          {contentPoints.loading ? (
            <p>加载中…</p>
          ) : contentPoints.error ? (
            <p className="text-error">{contentPoints.error}</p>
          ) : contentPoints.data.length === 0 ? (
            <EmptyState label="暂无内容点" />
          ) : (
            <ul className="list">
              {contentPoints.data.map((point) => (
                <li key={point.id} className="list__item">
                  <div>
                    <strong>{point.title}</strong>
                    <p className="muted">{point.description}</p>
                  </div>
                  <div className="tags">
                    <Badge label={point.category} />
                    <span className="small muted">
                      半径 {point.geofence_radius_m}m · {point.latitude.toFixed(4)}/
                      {point.longitude.toFixed(4)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="推荐路线" description="围绕主题的 Citywalk 路线。">
          {routes.loading ? (
            <p>加载中…</p>
          ) : routes.error ? (
            <p className="text-error">{routes.error}</p>
          ) : routes.data.length === 0 ? (
            <EmptyState label="暂无路线" />
          ) : (
            <ul className="list">
              {routes.data.map((route) => (
                <li key={route.id} className="list__item">
                  <div>
                    <strong>{route.name}</strong>
                    <p className="muted">
                      主题：{route.theme} · {route.distance_km} km
                    </p>
                  </div>
                  <span className="badge">{route.waypoints.length} 个路标</span>
                </li>
              ))}
            </ul>
          )}
          {busiestRoute ? (
            <p className="muted small">
              提示：后端返回的第一个路线将用作前端地图的默认展示数据。
            </p>
          ) : null}
        </SectionCard>

        <SectionCard
          title="轨迹记录"
          description="模拟客户端上传轨迹点；后端暂存并可回读。"
          actions={
            <button
              className="button"
              type="button"
              onClick={sendMockTrack}
              disabled={!userId}
            >
              发送示例轨迹
            </button>
          }
        >
          <label className="field">
            登录用户
            <input
              className="input"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="输入登录账号"
            />
          </label>
          {tracks.loading ? (
            <p>加载中…</p>
          ) : tracks.error ? (
            <p className="text-error">{tracks.error}</p>
          ) : tracks.data.length === 0 ? (
            <EmptyState label="尚未记录任何轨迹" />
          ) : (
            <ul className="list">
              {tracks.data.map((track, index) => (
                <li key={`${track.user_id}-${index}`} className="list__item">
                  <div>
                    <strong>{track.user_id}</strong>
                    <p className="muted small">
                      {track.points.length} 个点 · 起始{" "}
                      {new Date(track.points[0].recorded_at).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {actionMessage ? <p className="muted small">{actionMessage}</p> : null}
        </SectionCard>

        <SectionCard
          title="内容管理"
          description="登录后对内容点进行创建、标签与媒体管理。"
        >
          <ul className="list">
            <li className="list__item">
              <strong>批量导入</strong>
              <p className="muted small">支持 CSV / GeoJSON 上传并自动生成围栏。</p>
            </li>
            <li className="list__item">
              <strong>媒体绑定</strong>
              <p className="muted small">图文、音频与多语言讲解一站式管理。</p>
            </li>
            <li className="list__item">
              <strong>审核流</strong>
              <p className="muted small">内容上线前需通过城市编辑审核。</p>
            </li>
          </ul>
        </SectionCard>

        <SectionCard
          title="路线规划"
          description="根据实时客流、时长与主题自动生成推荐路线。"
        >
          <ul className="list">
            <li className="list__item">
              <strong>个性化偏好</strong>
              <p className="muted small">按主题、距离、时段快速筛选路线。</p>
            </li>
            <li className="list__item">
              <strong>多端协同</strong>
              <p className="muted small">支持管理端拖拽调整路标顺序。</p>
            </li>
            <li className="list__item">
              <strong>实时校准</strong>
              <p className="muted small">结合轨迹热力动态调整推荐线路。</p>
            </li>
          </ul>
        </SectionCard>
      </main>
    </div>
  );
}

export default App;
