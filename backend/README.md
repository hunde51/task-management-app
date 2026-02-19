# Backend - Task & Team Management API

## Run locally
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

## Architecture
- `app/models`: SQLAlchemy entities
- `app/schemas`: Pydantic request/response contracts
- `app/services`: business logic and authorization checks
- `app/routes`: FastAPI route handlers
- `app/core`: config, security, errors, DB

## API Response Format
All endpoints return:
```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

## Core Endpoints
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET/POST /teams/`
- `GET /teams/{team_id}/members`
- `POST /teams/{team_id}/members/invite`
- `GET/POST /teams/{team_id}/projects`
- `PATCH/DELETE /projects/{project_id}`
- `GET/POST /tasks/`
- `PATCH /tasks/{task_id}`
- `PATCH /tasks/{task_id}/status`
- `PATCH /tasks/{task_id}/assign`
- `DELETE /tasks/{task_id}`
- `GET /tasks/me/summary`
