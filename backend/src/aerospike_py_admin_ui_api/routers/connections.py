from __future__ import annotations

import time
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException

from aerospike_py_admin_ui_api import db
from aerospike_py_admin_ui_api.models.connection import ConnectionProfile, ConnectionStatus

router = APIRouter(prefix="/api/connections", tags=["connections"])


@router.get("")
async def list_connections() -> list[ConnectionProfile]:
    return await db.get_all_connections()


@router.post("", status_code=201)
async def create_connection(body: dict) -> ConnectionProfile:
    now = datetime.now(UTC).isoformat()
    conn = ConnectionProfile(
        id=f"conn-{int(time.time() * 1000)}",
        name=body.get("name", "New Connection"),
        hosts=body.get("hosts", ["localhost"]),
        port=body.get("port", 3000),
        clusterName=body.get("clusterName"),
        username=body.get("username"),
        password=body.get("password"),
        color=body.get("color", "#0097D3"),
        createdAt=now,
        updatedAt=now,
    )
    await db.create_connection(conn)
    return conn


@router.get("/{conn_id}")
async def get_connection(conn_id: str) -> ConnectionProfile:
    conn = await db.get_connection(conn_id)
    if not conn:
        raise HTTPException(status_code=404, detail=f"Connection '{conn_id}' not found")
    return conn


@router.put("/{conn_id}")
async def update_connection(conn_id: str, body: dict) -> ConnectionProfile:
    conn = await db.update_connection(conn_id, body)
    if not conn:
        raise HTTPException(status_code=404, detail=f"Connection '{conn_id}' not found")
    return conn


@router.get("/{conn_id}/health")
async def get_connection_health(conn_id: str) -> ConnectionStatus:
    conn = await db.get_connection(conn_id)
    if not conn:
        raise HTTPException(status_code=404, detail=f"Connection '{conn_id}' not found")
    # Mock health response — will be replaced with real Aerospike client later
    return ConnectionStatus(
        connected=True,
        nodeCount=1,
        namespaceCount=1,
        build="8.1.0.0",
        edition="Aerospike Community Edition",
    )


@router.post("/{conn_id}")
async def test_connection(conn_id: str) -> dict:
    conn = await db.get_connection(conn_id)
    if not conn:
        raise HTTPException(status_code=404, detail=f"Connection '{conn_id}' not found")
    return {"success": True, "message": "Connected successfully"}


@router.delete("/{conn_id}")
async def delete_connection(conn_id: str) -> dict:
    deleted = await db.delete_connection(conn_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Connection '{conn_id}' not found")
    return {"message": "Connection deleted"}
