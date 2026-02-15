# =============================================================================
# Stage 1: Frontend build
# =============================================================================
FROM node:22-alpine AS frontend-deps
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY --from=frontend-deps /app/node_modules ./node_modules
COPY frontend/ .
ENV NEXT_TELEMETRY_DISABLED=1
ENV BACKEND_URL=http://localhost:8000
RUN npm run build

# =============================================================================
# Stage 2: Backend build
# =============================================================================
FROM python:3.13-slim AS backend-builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app/backend

COPY backend/pyproject.toml backend/uv.lock backend/README.md ./
RUN uv sync --frozen --no-dev --no-install-project

COPY backend/src/ src/
RUN uv sync --frozen --no-dev

# =============================================================================
# Stage 3: Production runtime (Python + Node.js)
# =============================================================================
FROM python:3.13-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/backend /app/backend

# Copy frontend (Next.js standalone)
COPY --from=frontend-builder /app/public /app/frontend/public
COPY --from=frontend-builder /app/.next/standalone /app/frontend
COPY --from=frontend-builder /app/.next/static /app/frontend/.next/static

# Copy entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Frontend: 3000, Backend: 8000
EXPOSE 3000 8000

ENTRYPOINT ["/app/entrypoint.sh"]
