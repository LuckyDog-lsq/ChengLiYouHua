import { useEffect, useMemo, useState } from "react";
import { fetchContentPoints, fetchRoutes, fetchTracks, sendTrack } from "./api";
import type { CityRoute, ContentPoint, Track } from "./types";

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

  useEffect(() => {
    fetchContentPoints()
      .then((points) => setContentPoints({ data: points, loading: false }))
      .catch((error) =>
        setContentPoints({ data: [], loading: false, error: error.message }),
      );

    fetchRoutes()
      .then((items) => setRoutes({ data: items, loading: false }))
      .catch((error) => setRoutes({ data: [], loading: false, error: error.message }));

    fetchTracks()
      .then((items) => setTracks({ data: items, loading: false }))
      .catch((error) => setTracks({ data: [], loading: false, error: error.message }));
  }, []);

  const busiestRoute = useMemo(() => routes.data[0], [routes.data]);

  const sendMockTrack = async () => {
    setActionMessage("正在发送示例轨迹…");
    try {
      const now = new Date();
      const response = await sendTrack("demo-web-user", [
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
      const refreshed = await fetchTracks();
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
            <button className="button" type="button" onClick={sendMockTrack}>
              发送示例轨迹
            </button>
          }
        >
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
      </main>
    </div>
  );
}

export default App;
