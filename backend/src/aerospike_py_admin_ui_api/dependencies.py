"""Shared FastAPI dependencies."""

from __future__ import annotations

import asyncio
from typing import Annotated

import aerospike_py
from fastapi import Depends, HTTPException, Path

from aerospike_py_admin_ui_api import db
from aerospike_py_admin_ui_api.client_manager import client_manager


async def _get_verified_connection(conn_id: str = Path()) -> str:
    """Verify that a connection profile exists and return its id."""
    conn = await db.get_connection(conn_id)
    if not conn:
        raise HTTPException(status_code=404, detail=f"Connection '{conn_id}' not found")
    return conn_id


async def _get_client(conn_id: str = Depends(_get_verified_connection)) -> aerospike_py.Client:
    """Resolve *conn_id* and return a cached Aerospike client."""
    return await asyncio.to_thread(client_manager._get_client_sync, conn_id)


VerifiedConnId = Annotated[str, Depends(_get_verified_connection)]
"""Inject a verified connection id from the path."""

AerospikeClient = Annotated[aerospike_py.Client, Depends(_get_client)]
"""Inject a cached Aerospike client resolved from the path ``conn_id``."""
