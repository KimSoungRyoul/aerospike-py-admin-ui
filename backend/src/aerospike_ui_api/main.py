from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from aerospike_ui_api import config
from aerospike_ui_api.routers import (
    connections,
    clusters,
    records,
    query,
    indexes,
    terminal,
    admin_users,
    admin_roles,
    udfs,
    metrics,
)

app = FastAPI(title="Aerospike UI API", version="0.1.0")

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
