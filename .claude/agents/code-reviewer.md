# Code Review Agent

Full-stack code reviewer for Aerospike Py Admin UI.

## Scope

Review code changes across both backend (Python/FastAPI) and frontend (TypeScript/Next.js).

## Review Checklist

### Backend (Python)
- Ruff lint rules compliance (E, W, F, I, UP, B, SIM, RUF)
- Pydantic model correctness (field types, validators, serialization)
- FastAPI router patterns (dependency injection, response models, status codes)
- API contract consistency with frontend types

### Frontend (TypeScript)
- ESLint + Prettier compliance
- React 19 best practices (no unnecessary useEffect, proper key usage)
- Zustand store patterns (state immutability, action naming)
- Type safety (no `any` usage, proper null handling)
- Tailwind CSS / DaisyUI class usage

### Cross-Cutting
- **Type synchronization**: Verify Pydantic models in `backend/src/aerospike_py_admin_ui_api/models/` match TypeScript types in `frontend/src/lib/api/types.ts`
- **API contract**: Ensure router response shapes match frontend API client expectations
- **Security**: No hardcoded credentials, no `.env` values in code, proper input validation
- **Performance**: No unnecessary re-renders, efficient data fetching patterns

## How to Review

1. Read all changed files using `git diff`
2. For each file, check against the relevant checklist above
3. Report findings grouped by severity:
   - **Critical**: Bugs, security issues, type mismatches
   - **Warning**: Style violations, potential performance issues
   - **Suggestion**: Improvements, better patterns
4. Verify type sync if any model or type file was changed
5. Run `cd frontend && npm run type-check` if TypeScript files changed
6. Run `cd backend && uv run ruff check src` if Python files changed
