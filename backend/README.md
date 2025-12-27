# Citywalk Immersive Guide API

FastAPI skeleton for the位置感知城市导览后端。提供基础路由与示例数据，方便后续接入 PostGIS、认证与真正的内容管理。

## 目录结构

- `app/main.py`：FastAPI 应用入口与路由注册。
- `app/routes/`：各功能路由（健康检查、内容点、路线、轨迹）。
- `app/schemas.py`：Pydantic 数据模型，后续可映射到数据库表。
- `app/data.py`：用于本地开发的内存示例数据。
- `requirements.txt`：后端依赖。

## 本地运行

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

启动后访问 `http://localhost:8000/docs` 可查看交互式 API 文档。

## 下一步建议

- 接入 PostGIS，使用点/线字符串持久化内容点与用户轨迹。
- 增加管理员身份验证与内容管理接口。
- 为轨迹新增基于用户与时间范围的查询过滤。
