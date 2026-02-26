FROM python:3.13-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-dev --no-install-project

COPY src/ src/
RUN uv sync --frozen --no-dev

RUN groupadd --gid 1001 appuser \
    && useradd --uid 1001 --gid appuser --shell /bin/false --create-home appuser

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=15s \
    CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["uv", "run", "uvicorn", "aerospike_cluster_manager_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
