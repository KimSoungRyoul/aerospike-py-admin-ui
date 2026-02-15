# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aerospike UI — Aerospike Community Edition을 위한 풀스택 GUI 관리 도구. FastAPI 백엔드 + Next.js 프론트엔드로 구성되며, Docker Compose로 오케스트레이션된다.

## Commands

### Full Stack (Docker)
```bash
docker compose up --build          # 전체 스택 실행 (Aerospike + Backend + Frontend)
docker compose down                # 전체 스택 종료
```

### Backend (Python 3.13 / FastAPI)
```bash
cd backend
uv run uvicorn aerospike_ui_api.main:app --reload  # 개발 서버 (port 8000)
uv run ruff check src --fix                         # lint + autofix
uv run ruff format src                              # format
```

### Frontend (Next.js 16 / React 19)
```bash
cd frontend
npm run dev              # 개발 서버 (port 3000)
npm run build            # 프로덕션 빌드
npm run lint             # ESLint
npm run lint:fix         # ESLint autofix
npm run format           # Prettier format
npm run format:check     # Prettier check
npm run type-check       # TypeScript strict check
npm run test             # Vitest 단위 테스트
npm run test:watch       # Vitest watch 모드
npm run test:coverage    # Vitest + coverage (v8)
npm run test:e2e         # Playwright E2E 테스트
```

### Pre-commit
```bash
pre-commit run --all-files  # 전체 파일에 pre-commit 실행
```

## Architecture

```
aerospike-ui/
├── backend/           # FastAPI REST API (Python 3.13, uv)
│   └── src/aerospike_ui_api/
│       ├── main.py        # FastAPI app, CORS, router 등록, /api/health
│       ├── config.py      # 환경변수 기반 설정
│       ├── store.py       # in-memory mock data store (개발용)
│       ├── models/        # Pydantic 모델 (connection, cluster, record, index, admin, udf, metrics, query, terminal)
│       ├── routers/       # REST 엔드포인트 (/api/* prefix)
│       └── mock_data/     # 개발용 mock 데이터 생성기
├── frontend/          # Next.js 16 App Router (React 19, TypeScript)
│   └── src/
│       ├── app/           # 페이지 라우팅 (App Router)
│       ├── components/    # UI 컴포넌트
│       │   ├── ui/        # Radix 기반 공통 프리미티브 (shadcn/ui 패턴)
│       │   ├── common/    # 재사용 컴포넌트 (json-viewer, code-editor, status-badge 등)
│       │   ├── layout/    # 앱 쉘 (header, sidebar, tab-bar)
│       │   └── connection/, admin/  # 도메인별 컴포넌트
│       ├── stores/        # Zustand 스토어 (connection, browser, query, admin, metrics, ui)
│       ├── hooks/         # 커스텀 훅 (use-async-data, use-debounce, use-pagination 등)
│       └── lib/
│           ├── api/       # API 클라이언트 (자동 retry, timeout, 타입 안전)
│           ├── validations/  # Zod 스키마
│           ├── constants.ts  # CE 제한, 브랜드 컬러, 페이지 사이즈
│           ├── formatters.ts # 숫자/바이트/업타임 포매터
│           └── utils.ts      # cn() (clsx + tailwind-merge)
└── docker-compose.yml  # Aerospike + Backend + Frontend
```

### Key Architectural Decisions

- **API Proxy**: Next.js의 `rewrites`를 통해 `/api/*` 요청을 백엔드로 프록시. `BACKEND_URL` 환경변수로 대상 설정 (기본: `http://localhost:8000`).
- **State Management**: Zustand 스토어가 도메인별로 분리됨. `ui-store`만 `persist` 미들웨어로 localStorage에 영속화.
- **Type Mirroring**: 백엔드 Pydantic 모델과 프론트엔드 TypeScript 타입(`lib/api/types.ts`)이 수동으로 동기화됨. 모델 변경 시 양쪽 모두 업데이트 필요.
- **Styling**: Tailwind CSS 4 + DaisyUI 5. CSS 커스텀 프로퍼티로 라이트/다크 모드 테마. `globals.css`에 커스텀 애니메이션 정의.
- **Path Alias**: `@/`가 `frontend/src/`를 가리킴 (tsconfig + vitest에서 모두 설정됨).

### Frontend Route Structure
| Route | 기능 |
|---|---|
| `/` | 커넥션 목록/관리 |
| `/cluster/[connId]` | 클러스터 개요, 노드, 네임스페이스, 메트릭, Prometheus |
| `/browser/[connId]` | 네임스페이스/셋 트리 |
| `/browser/[connId]/[ns]/[set]` | 레코드 브라우저 (페이지네이션) |
| `/query/[connId]` | 쿼리 빌더 (scan/query + predicates) |
| `/indexes/[connId]` | 세컨더리 인덱스 관리 |
| `/admin/[connId]` | 사용자/역할 관리 |
| `/udfs/[connId]` | UDF 관리 |
| `/terminal/[connId]` | AQL 터미널 |

## Code Style

- **Backend**: Ruff (line-length=120, target=py313). isort로 import 정렬. `E`, `W`, `F`, `I`, `UP`, `B`, `SIM`, `RUF` 규칙 적용.
- **Frontend**: ESLint (next/core-web-vitals + typescript). Prettier (printWidth=100, doubleQuote). `no-console: warn`. 테스트 파일에서 `no-explicit-any` 허용.
- **Pre-commit**: trailing-whitespace, end-of-file-fixer, check-yaml/json, Ruff(backend), ESLint+Prettier(frontend) 자동 실행.

## Environment Variables

`.env.example` 참조. Docker Compose에서 사용:
- `AEROSPIKE_HOST`, `AEROSPIKE_PORT` — Aerospike 서버 접속 정보
- `BACKEND_PORT` (기본 8000), `FRONTEND_PORT` (기본 3100)
- `CORS_ORIGINS` — 백엔드 CORS 허용 오리진
