"""Shared FastAPI dependencies."""

from __future__ import annotations

import asyncio
import logging
from typing import Annotated

import aerospike_py
from fastapi import Depends, HTTPException, Path

from aerospike_cluster_manager_api import db
from aerospike_cluster_manager_api.client_manager import client_manager

logger = logging.getLogger(__name__)


async def _get_verified_connection(conn_id: str = Path()) -> str:
    """Verify that a connection profile exists and return its id."""
    conn = await db.get_connection(conn_id)
    if not conn:
        raise HTTPException(status_code=404, detail=f"Connection '{conn_id}' not found")
    return conn_id


async def _get_client(conn_id: str = Depends(_get_verified_connection)) -> aerospike_py.Client:
    """Resolve *conn_id* and return a cached Aerospike client."""
    try:
        return await asyncio.to_thread(client_manager._get_client_sync, conn_id)
    except Exception as e:
        logger.warning("Failed to connect to Aerospike for connection '%s': %s", conn_id, e)
        raise HTTPException(
            status_code=503,
            detail=f"Unable to connect to Aerospike cluster for connection '{conn_id}'",
        ) from e


VerifiedConnId = Annotated[str, Depends(_get_verified_connection)]
"""Inject a verified connection id from the path."""

AerospikeClient = Annotated[aerospike_py.Client, Depends(_get_client)]
"""Inject a cached Aerospike client resolved from the path ``conn_id``."""
