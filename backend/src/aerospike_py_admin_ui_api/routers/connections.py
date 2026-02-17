from __future__ import annotations

import asyncio
import contextlib
import time
from datetime import UTC, datetime
from typing import Any

import aerospike_py
from fastapi import APIRouter, Depends, HTTPException

from aerospike_py_admin_ui_api import db
from aerospike_py_admin_ui_api.client_manager import client_manager
from aerospike_py_admin_ui_api.constants import INFO_BUILD, INFO_EDITION, INFO_NAMESPACES
from aerospike_py_admin_ui_api.dependencies import AerospikeClient, _get_verified_connection
from aerospike_py_admin_ui_api.info_parser import parse_list
from aerospike_py_admin_ui_api.models.connection import (
    ConnectionProfile,
    ConnectionStatus,
    CreateConnectionRequest,
    TestConnectionRequest,
    UpdateConnectionRequest,
)

router = APIRouter(prefix="/api/connections", tags=["connections"])


@router.get("")
async def list_connections() -> list[ConnectionProfile]:
    return await db.get_all_connections()


@router.post("", status_code=201)
async def create_connection(body: CreateConnectionRequest) -> ConnectionProfile:
    now = datetime.now(UTC).isoformat()
    conn = ConnectionProfile(
        id=f"conn-{int(time.time() * 1000)}",
        name=body.name,
        hosts=body.hosts,
        port=body.port,
        clusterName=body.clusterName,
        username=body.username,
        password=body.password,
        color=body.color,
        createdAt=now,
        updatedAt=now,
    )
    await db.create_connection(conn)
    return conn


@router.get("/{conn_id}")
async def get_connection(conn_id: str = Depends(_get_verified_connection)) -> ConnectionProfile:
    conn = await db.get_connection(conn_id)
    return conn  # type: ignore[return-value]


@router.put("/{conn_id}")
async def update_connection(
    body: UpdateConnectionRequest,
    conn_id: str = Depends(_get_verified_connection),
) -> ConnectionProfile:
    update_data = body.model_dump(exclude_none=True)
    conn = await db.update_connection(conn_id, update_data)
    if not conn:
        raise HTTPException(status_code=404, detail=f"Connection '{conn_id}' not found")
    return conn


def _health_sync(c) -> dict:
    node_names = c.get_node_names()
    ns_raw = c.info_random_node(INFO_NAMESPACES)
    namespaces = parse_list(ns_raw)
    build = c.info_random_node(INFO_BUILD).strip()
    edition = c.info_random_node(INFO_EDITION).strip()
    return {
        "node_count": len(node_names),
        "namespace_count": len(namespaces),
        "build": build,
        "edition": edition,
    }


@router.get("/{conn_id}/health")
async def get_connection_health(client: AerospikeClient) -> ConnectionStatus:
    try:
        info = await asyncio.to_thread(_health_sync, client)
        return ConnectionStatus(
            connected=True,
            nodeCount=info["node_count"],
            namespaceCount=info["namespace_count"],
            build=info["build"],
            edition=info["edition"],
        )
    except Exception:
        return ConnectionStatus(connected=False, nodeCount=0, namespaceCount=0)


def _test_connect_sync(body: TestConnectionRequest) -> dict:
    hosts: list[tuple[str, int]] = []
    for h in body.hosts:
        if ":" in h:
            host, port_str = h.rsplit(":", 1)
            try:
                hosts.append((host, int(port_str)))
            except ValueError:
                hosts.append((h, body.port))
        else:
            hosts.append((h, body.port))

    config: dict[str, Any] = {"hosts": hosts}
    if body.username and body.password:
        config["user"] = body.username
        config["password"] = body.password

    client = aerospike_py.client(config).connect()
    try:
        if not client.is_connected():
            return {"success": False, "message": "Failed to connect"}
        return {"success": True, "message": "Connected successfully"}
    finally:
        with contextlib.suppress(Exception):
            client.close()


@router.post("/test")
async def test_connection(body: TestConnectionRequest) -> dict:
    try:
        return await asyncio.to_thread(_test_connect_sync, body)
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.delete("/{conn_id}")
async def delete_connection(conn_id: str = Depends(_get_verified_connection)) -> dict:
    await db.delete_connection(conn_id)
    await client_manager.close_client(conn_id)
    return {"message": "Connection deleted"}
