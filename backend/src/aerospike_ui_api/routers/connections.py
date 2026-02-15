from __future__ import annotations

import time
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException

from aerospike_ui_api import store
from aerospike_ui_api.models.connection import ConnectionStatus, ConnectionWithStatus

router = APIRouter(prefix="/api/connections", tags=["connections"])


@router.get("")
def list_connections() -> list[ConnectionWithStatus]:
    return store.connections


@router.post("", status_code=201)
def create_connection(body: dict) -> ConnectionWithStatus:
    now = datetime.now(UTC).isoformat()
    conn = ConnectionWithStatus(
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
        status=ConnectionStatus(connected=False, nodeCount=0, namespaceCount=0),
    )
    store.connections.append(conn)
    return conn


@router.get("/{conn_id}")
def get_connection(conn_id: str) -> ConnectionWithStatus:
    for c in store.connections:
        if c.id == conn_id:
            return c
    raise HTTPException(status_code=404, detail=f"Connection '{conn_id}' not found")


@router.put("/{conn_id}")
def update_connection(conn_id: str, body: dict) -> ConnectionWithStatus:
    for i, c in enumerate(store.connections):
        if c.id == conn_id:
            data = c.model_dump()
            data.update(body)
            data["id"] = conn_id
            data["updatedAt"] = datetime.now(UTC).isoformat()
            updated = ConnectionWithStatus(**data)
            store.connections[i] = updated
            return updated
    raise HTTPException(status_code=404, detail=f"Connection '{conn_id}' not found")


@router.post("/{conn_id}")
def test_connection(conn_id: str) -> dict:
    for c in store.connections:
        if c.id == conn_id:
            return {"success": True, "message": "Connected successfully"}
    raise HTTPException(status_code=404, detail=f"Connection '{conn_id}' not found")


@router.delete("/{conn_id}")
def delete_connection(conn_id: str) -> dict:
    for i, c in enumerate(store.connections):
        if c.id == conn_id:
            store.connections.pop(i)
            return {"message": "Connection deleted"}
    raise HTTPException(status_code=404, detail=f"Connection '{conn_id}' not found")
