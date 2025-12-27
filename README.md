# 城语 | Citywalk 沉浸式导览

本仓库提供城市慢行导览应用的前后端基础框架，包含 FastAPI 后端与 React/Vite 前端，支持“走到哪、听到哪”的位置触发式讲解体验。

## 快速开始

### 后端（FastAPI）

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

启动后可在 `http://localhost:8000/docs` 体验接口（内容点、推荐路线、轨迹记录等）。

### 前端（React + Vite + TypeScript）

```bash
cd frontend
npm install
npm run dev
```

默认会从 `http://localhost:8000` 读取 API 数据。若需调整，可在启动命令前设置环境变量 `VITE_API_BASE`。

## 目录结构概览

- `backend/`：FastAPI 应用，包含示例数据与基础路由。
- `frontend/`：React/Vite 单页应用，展示内容点、路线与轨迹上传。
- `.gitignore`：忽略虚拟环境与构建产物。
