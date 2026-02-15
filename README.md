# Aerospike UI

Aerospike Community Edition을 위한 웹 기반 GUI 관리 도구.

클러스터 모니터링, 레코드 브라우징, 쿼리 실행, 인덱스 관리, 사용자/역할 관리, UDF 관리, AQL 터미널 등의 기능을 제공합니다.

## Tech Stack

| Layer | Stack |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, DaisyUI 5, Zustand, TanStack Table, Recharts, Monaco Editor |
| **Backend** | Python 3.13, FastAPI, Uvicorn, Pydantic |
| **Database** | Aerospike Server Enterprise 8.0 |
| **Infra** | Docker Compose, uv (Python), npm (Node.js) |

## Quick Start

### Docker Compose (권장)

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3100
- Backend API: http://localhost:8000
- Aerospike: localhost:3000

### Local Development

**Backend:**
```bash
cd backend
uv sync                            # 의존성 설치
uv run uvicorn aerospike_ui_api.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install                        # 의존성 설치
npm run dev                        # http://localhost:3000
```

> Frontend 개발 서버는 `/api/*` 요청을 `http://localhost:8000`으로 프록시합니다.

## Features

- **Connection Management** — 다중 Aerospike 클러스터 접속 프로필 관리
- **Cluster Overview** — 노드 상태, 네임스페이스, 실시간 메트릭 모니터링
- **Record Browser** — 네임스페이스/셋 탐색, 레코드 CRUD, 페이지네이션
- **Query Builder** — Scan/Query 실행, predicate 기반 필터링
- **Index Management** — 세컨더리 인덱스 생성/삭제
- **Admin** — 사용자/역할 CRUD (CE 제한 표시 포함)
- **UDF Management** — Lua UDF 업로드/삭제
- **AQL Terminal** — 웹 기반 AQL 명령어 실행
- **Prometheus Metrics** — 클러스터 메트릭 내보내기
- **Light/Dark Mode** — 시스템 테마 연동

## Project Structure

```
aerospike-ui/
├── backend/                # FastAPI REST API
│   ├── src/aerospike_ui_api/
│   │   ├── main.py         # App entry point
│   │   ├── models/         # Pydantic models
│   │   ├── routers/        # API endpoints
│   │   └── mock_data/      # Dev mock data
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/               # Next.js App Router
│   ├── src/
│   │   ├── app/            # Pages & routing
│   │   ├── components/     # UI components
│   │   ├── stores/         # Zustand state
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # API client, utils, types
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── .env.example
```

## Development

### Testing

```bash
cd frontend
npm run test              # Unit tests (Vitest)
npm run test:coverage     # With coverage report
npm run test:e2e          # E2E tests (Playwright)
```

### Code Quality

```bash
# Frontend
cd frontend
npm run lint              # ESLint
npm run format:check      # Prettier check
npm run type-check        # TypeScript

# Backend
cd backend
uv run ruff check src     # Lint
uv run ruff format src    # Format

# Pre-commit (both)
pre-commit run --all-files
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `AEROSPIKE_HOST` | `aerospike` | Aerospike server host |
| `AEROSPIKE_PORT` | `3000` | Aerospike service port |
| `BACKEND_PORT` | `8000` | Backend API port |
| `FRONTEND_PORT` | `3100` | Frontend port |
| `CORS_ORIGINS` | `http://localhost:3100` | Allowed CORS origins |
| `BACKEND_URL` | `http://localhost:8000` | Backend URL (frontend proxy target) |

## License

Private
