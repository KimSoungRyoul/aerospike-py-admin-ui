from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from aerospike_py_admin_ui_api import config, db
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
    db.close_db()


app = FastAPI(title="Aerospike Py Admin UI API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
