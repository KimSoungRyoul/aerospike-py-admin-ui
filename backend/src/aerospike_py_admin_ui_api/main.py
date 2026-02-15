from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from aerospike_py_admin_ui_api import config, db
from aerospike_py_admin_ui_api.client_manager import client_manager
from aerospike_py_admin_ui_api.routers import (
    admin_roles,
    admin_users,
    clusters,
    connections,
    indexes,
    metrics,
    query,
    records,
    terminal,
    udfs,
)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    db.init_db()
    yield
    await client_manager.close_all()
    db.close_db()


app = FastAPI(title="Aerospike Py Admin UI API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Global exception handlers for aerospike-py errors
# ---------------------------------------------------------------------------

try:
    from aerospike_py.exception import (
        AdminError,
        AerospikeError,
        AerospikeTimeoutError,
        ClusterError,
        IndexFoundError,
        IndexNotFound,
        RecordExistsError,
        RecordGenerationError,
        RecordNotFound,
    )

    @app.exception_handler(RecordNotFound)
    async def _record_not_found(_req: Request, exc: RecordNotFound) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": "Record not found"})

    @app.exception_handler(RecordExistsError)
    async def _record_exists(_req: Request, exc: RecordExistsError) -> JSONResponse:
        return JSONResponse(status_code=409, content={"detail": "Record already exists"})

    @app.exception_handler(RecordGenerationError)
    async def _record_generation(_req: Request, exc: RecordGenerationError) -> JSONResponse:
        return JSONResponse(status_code=409, content={"detail": "Generation conflict"})

    @app.exception_handler(IndexNotFound)
    async def _index_not_found(_req: Request, exc: IndexNotFound) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": "Index not found"})

    @app.exception_handler(IndexFoundError)
    async def _index_found(_req: Request, exc: IndexFoundError) -> JSONResponse:
        return JSONResponse(status_code=409, content={"detail": "Index already exists"})

    @app.exception_handler(AdminError)
    async def _admin_error(_req: Request, exc: AdminError) -> JSONResponse:
        return JSONResponse(
            status_code=403,
            content={"detail": "User/role management requires Aerospike Enterprise Edition"},
        )

    @app.exception_handler(AerospikeTimeoutError)
    async def _timeout_error(_req: Request, exc: AerospikeTimeoutError) -> JSONResponse:
        return JSONResponse(status_code=504, content={"detail": "Operation timed out"})

    @app.exception_handler(ClusterError)
    async def _cluster_error(_req: Request, exc: ClusterError) -> JSONResponse:
        return JSONResponse(status_code=503, content={"detail": f"Connection error: {exc}"})

    @app.exception_handler(AerospikeError)
    async def _aerospike_error(_req: Request, exc: AerospikeError) -> JSONResponse:
        return JSONResponse(status_code=500, content={"detail": f"Aerospike error: {exc}"})

except ImportError:
    pass

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(connections.router)
app.include_router(clusters.router)
app.include_router(records.router)
app.include_router(query.router)
app.include_router(indexes.router)
app.include_router(terminal.router)
app.include_router(admin_users.router)
app.include_router(admin_roles.router)
app.include_router(udfs.router)
app.include_router(metrics.router)


@app.get("/api/health")
def health_check() -> dict:
    return {"status": "ok"}
