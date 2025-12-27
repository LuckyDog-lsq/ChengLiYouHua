import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { fetchContentPoints, fetchRoutes, fetchTracks, sendTrack } from "./api";
import type { CityRoute, ContentPoint, Track, TrackPoint, UserProfile } from "./types";

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

function MapCanvas({
  contentPoints,
  tracks,
  activeRoute,
}: {
  contentPoints: ContentPoint[];
  tracks: Track[];
  activeRoute?: CityRoute;
}) {
  const coordinates: { latitude: number; longitude: number }[] = [];
  contentPoints.forEach((point) =>
    coordinates.push({ latitude: point.latitude, longitude: point.longitude }),
  );
  activeRoute?.waypoints.forEach((waypoint) =>
    coordinates.push({ latitude: waypoint.latitude, longitude: waypoint.longitude }),
  );
  tracks.forEach((track) =>
    track.points.forEach((point) =>
      coordinates.push({ latitude: point.latitude, longitude: point.longitude }),
    ),
  );

  if (coordinates.length === 0) {
    return (
      <div className="map map--empty">
        <p className="muted small">暂无可展示的坐标数据</p>
      </div>
    );
  }

  const lats = coordinates.map((c) => c.latitude);
  const lngs = coordinates.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = Math.max(maxLat - minLat, 0.01);
  const lngRange = Math.max(maxLng - minLng, 0.01);

  const toXY = (latitude: number, longitude: number) => ({
    x: ((longitude - minLng) / lngRange) * 100,
    y: 100 - ((latitude - minLat) / latRange) * 100,
  });

  const routePoints =
    activeRoute?.waypoints.map((w) => {
      const { x, y } = toXY(w.latitude, w.longitude);
      return `${x},${y}`;
    }) ?? [];

  const trackPaths = tracks.map((track) =>
    track.points.map((p) => {
      const { x, y } = toXY(p.latitude, p.longitude);
      return `${x},${y}`;
    }),
  );

  const palette = ["#2563eb", "#ea580c", "#0ea5e9", "#22c55e"];

  return (
    <div className="map">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        {routePoints.length > 0 ? (
          <polyline className="map__polyline map__polyline--route" points={routePoints.join(" ")} />
        ) : null}
        {trackPaths.map((path, index) =>
          path.length > 1 ? (
            <polyline
              key={index}
              className="map__polyline"
              stroke={palette[index % palette.length]}
              points={path.join(" ")}
            />
          ) : null,
        )}
        {contentPoints.map((point) => {
          const { x, y } = toXY(point.latitude, point.longitude);
          return (
            <circle
              key={point.id}
              cx={x}
              cy={y}
              r={2.2}
              className="map__point"
              data-title={point.title}
            >
              <title>{point.title}</title>
            </circle>
          );
        })}
      </svg>
      <div className="map__legend">
        <span className="map__legend-item">
          <span className="map__chip map__chip--route" />推荐路线
        </span>
        <span className="map__legend-item">
          <span className="map__chip map__chip--track" />最新轨迹
        </span>
        <span className="map__legend-item">
          <span className="map__chip map__chip--point" />内容点
        </span>
      </div>
    </div>
  );
}

function OverviewPage({
  contentPoints,
  routes,
  tracks,
  sendMockTrack,
  actionMessage,
  activeRoute,
  userId,
  onUserIdChange,
  onFilterTracks,
}: {
  contentPoints: FetchState<ContentPoint[]>;
  routes: FetchState<CityRoute[]>;
  tracks: FetchState<Track[]>;
  sendMockTrack: () => void;
  actionMessage: string;
  activeRoute?: CityRoute;
  userId: string;
  onUserIdChange: (value: string) => void;
  onFilterTracks: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const busiestRoute = useMemo(() => routes.data[0], [routes.data]);

  return (
    <>
      <SectionCard
        title="地图总览"
        description="内容点、路线与轨迹覆盖范围一目了然。"
        actions={<Badge label="轻量内置地图" />}
      >
        <MapCanvas
          contentPoints={contentPoints.data}
          tracks={tracks.data}
          activeRoute={activeRoute}
        />
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

      <SectionCard title="轨迹记录" description="与用户身份绑定的上传与查询。">
        <form className="toolbar" onSubmit={onFilterTracks}>
          <label className="toolbar__label" htmlFor="user-id">
            当前用户
          </label>
          <input
            id="user-id"
            className="input"
            value={userId}
            onChange={(event) => onUserIdChange(event.target.value)}
            placeholder="输入 user_id"
          />
          <button className="button" type="submit">
            查询轨迹
          </button>
          <button className="button button--ghost" type="button" onClick={sendMockTrack}>
            上传示例轨迹
          </button>
        </form>

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
        {actionMessage ? (
          <p className="muted small" role="status">
            {actionMessage}
          </p>
        ) : null}
        <p className="muted small">
          过滤条件：{userId ? `user_id=${userId}` : "全部用户"}
        </p>
      </SectionCard>
    </>
  );
}

function ContentManagementPage({
  contentPoints,
  userProfile,
}: {
  contentPoints: FetchState<ContentPoint[]>;
  userProfile: UserProfile;
}) {
  return (
    <>
      <SectionCard
        title="内容管理"
        description="基于用户权限的内容点维护。"
        actions={<Badge label={`${userProfile.role.toUpperCase()} 权限`} />}
      >
        <div className="grid grid--two">
          <div>
            <p className="muted small">当前登录用户</p>
            <strong>{userProfile.display_name}</strong>
            <p className="muted small">ID: {userProfile.id}</p>
            <div className="tags">
              {userProfile.permissions.map((permission) => (
                <Badge
                  key={permission.resource}
                  label={`${permission.resource}: ${permission.actions.join("/")}`}
                />
              ))}
            </div>
          </div>
          <div className="callout">
            <p className="muted">
              编辑权限将用于控制“新增内容点 / 修改文案 / 删除”等操作。当前示例用户可编辑内容与路线。
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="内容点列表"
        description="维护人员可在此批量修改或审核。"
        actions={<Badge label="草稿模式" />}
      >
        {contentPoints.loading ? (
          <p>加载中…</p>
        ) : contentPoints.error ? (
          <p className="text-error">{contentPoints.error}</p>
        ) : contentPoints.data.length === 0 ? (
          <EmptyState label="暂无内容点" />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>标题</th>
                <th>分类</th>
                <th>半径 (m)</th>
                <th>经纬度</th>
              </tr>
            </thead>
            <tbody>
              {contentPoints.data.map((point) => (
                <tr key={point.id}>
                  <td>{point.title}</td>
                  <td>{point.category}</td>
                  <td>{point.geofence_radius_m}</td>
                  <td className="muted small">
                    {point.latitude.toFixed(4)} / {point.longitude.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </>
  );
}

function RoutePlanningPage({
  routes,
  activeRoute,
  onSelectRoute,
  tracks,
  contentPoints,
}: {
  routes: FetchState<CityRoute[]>;
  activeRoute?: CityRoute;
  onSelectRoute: (routeId: string) => void;
  tracks: FetchState<Track[]>;
  contentPoints: FetchState<ContentPoint[]>;
}) {
  return (
    <>
      <SectionCard title="路线规划" description="根据主题选择或预览路线。">
        {routes.loading ? (
          <p>加载中…</p>
        ) : routes.error ? (
          <p className="text-error">{routes.error}</p>
        ) : routes.data.length === 0 ? (
          <EmptyState label="暂无路线" />
        ) : (
          <>
            <div className="toolbar">
              <label className="toolbar__label" htmlFor="route-select">
                选择路线
              </label>
              <select
                id="route-select"
                className="input"
                value={activeRoute?.id ?? ""}
                onChange={(event) => onSelectRoute(event.target.value)}
              >
                {routes.data.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name} · {route.theme}
                  </option>
                ))}
              </select>
              <Badge label={`${routes.data.length} 条可用`} />
            </div>
            {activeRoute ? (
              <div className="callout">
                <strong>{activeRoute.name}</strong>
                <p className="muted">
                  主题 {activeRoute.theme} · {activeRoute.distance_km} km · {activeRoute.waypoints.length}{" "}
                  个路标
                </p>
                <p className="muted small">
                  提示：可以将现有内容点挂载到路标上，用作场景化引导。
                </p>
              </div>
            ) : null}
          </>
        )}
      </SectionCard>

      <SectionCard title="路线地图" description="叠加路线与内容点，便于调整路标。">
        <MapCanvas
          contentPoints={contentPoints.data}
          tracks={tracks.data}
          activeRoute={activeRoute}
        />
      </SectionCard>
    </>
  );
}

function App() {
  const [contentPoints, setContentPoints] = useState<FetchState<ContentPoint[]>>(
    defaultState.contentPoints,
  );
  const [routes, setRoutes] = useState<FetchState<CityRoute[]>>(defaultState.routes);
  const [tracks, setTracks] = useState<FetchState<Track[]>>(defaultState.tracks);
  const [actionMessage, setActionMessage] = useState<string>("");
  const [userId, setUserId] = useState<string>("demo-web-user");
  const [focusedRouteId, setFocusedRouteId] = useState<string | null>(null);

  const userProfile: UserProfile = useMemo(
    () => ({
      id: userId,
      display_name: "演示用户",
      role: "editor",
      permissions: [
        { resource: "content", actions: ["create", "read", "update"] },
        { resource: "routes", actions: ["read", "plan"] },
        { resource: "tracks", actions: ["read"] },
      ],
    }),
    [userId],
  );

  const loadTracks = useCallback(
    async (user?: string) => {
      setTracks((previous) => ({ ...previous, loading: true, error: undefined }));
      try {
        const items = await fetchTracks(user);
        setTracks({ data: items, loading: false });
      } catch (error) {
        const message = error instanceof Error ? error.message : "轨迹加载失败";
        setTracks({ data: [], loading: false, error: message });
      }
    },
    [setTracks],
  );

  useEffect(() => {
    fetchContentPoints()
      .then((points) => setContentPoints({ data: points, loading: false }))
      .catch((error) =>
        setContentPoints({ data: [], loading: false, error: error.message }),
      );

    fetchRoutes()
      .then((items) => {
        setRoutes({ data: items, loading: false });
        setFocusedRouteId(items[0]?.id ?? null);
      })
      .catch((error) => setRoutes({ data: [], loading: false, error: error.message }));

    loadTracks();
  }, [loadTracks]);

  const activeRoute = useMemo(
    () =>
      focusedRouteId
        ? routes.data.find((route) => route.id === focusedRouteId)
        : routes.data[0],
    [focusedRouteId, routes.data],
  );

  const sendMockTrack = async () => {
    setActionMessage("正在发送示例轨迹…");
    try {
      const now = new Date();
      const samplePoints: TrackPoint[] = [
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
      ];
      const response = await sendTrack(userId, samplePoints);
      setActionMessage(response.message);
      await loadTracks(userId || undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "发送失败";
      setActionMessage(message);
    }
  };

  const handleFilterTracks = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadTracks(userId || undefined);
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
          <p className="muted small">user_id: {userId}</p>
        </div>
      </header>

      <nav className="tabs">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "tab active" : "tab")}>
          总览
        </NavLink>
        <NavLink to="/content" className={({ isActive }) => (isActive ? "tab active" : "tab")}>
          内容管理
        </NavLink>
        <NavLink to="/routes" className={({ isActive }) => (isActive ? "tab active" : "tab")}>
          路线规划
        </NavLink>
      </nav>

      <main className="grid">
        <Routes>
          <Route
            path="/"
            element={
              <OverviewPage
                contentPoints={contentPoints}
                routes={routes}
                tracks={tracks}
                sendMockTrack={sendMockTrack}
                actionMessage={actionMessage}
                activeRoute={activeRoute}
                userId={userId}
                onUserIdChange={setUserId}
                onFilterTracks={handleFilterTracks}
              />
            }
          />
          <Route
            path="/content"
            element={<ContentManagementPage contentPoints={contentPoints} userProfile={userProfile} />}
          />
          <Route
            path="/routes"
            element={
              <RoutePlanningPage
                routes={routes}
                activeRoute={activeRoute}
                onSelectRoute={setFocusedRouteId}
                tracks={tracks}
                contentPoints={contentPoints}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
