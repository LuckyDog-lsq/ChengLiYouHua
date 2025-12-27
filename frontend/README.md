# 前端（React + Vite）

城市慢行导览的前端骨架，展示后端提供的内容点、路线与轨迹数据，并提供“发送示例轨迹”的交互。

## 运行

```bash
cd frontend
npm install
npm run dev
```

默认读取 `http://localhost:8000` 的 API，可通过环境变量覆盖：

```bash
VITE_API_BASE="http://localhost:8001" npm run dev
```

## 主要文件

- `src/App.tsx`：页面结构与数据拉取逻辑。
- `src/api.ts`：与后端交互的简单封装。
- `src/types.ts`：与后端 schema 对齐的数据类型。
- `src/index.css`：基础样式。

## 下一步建议

- 在卡片中嵌入地图组件（例如 MapboxGL / Leaflet）以展示轨迹与内容点。
- 接入真实用户身份后，将轨迹上传与查询与用户绑定。
- 增加“内容管理”与“路线规划”页面，供维护人员使用。
