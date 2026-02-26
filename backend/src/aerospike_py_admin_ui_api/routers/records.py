from __future__ import annotations

import asyncio
import contextlib
import logging

from fastapi import APIRouter, HTTPException, Query

from aerospike_py_admin_ui_api.constants import MAX_QUERY_RECORDS, POLICY_QUERY, POLICY_READ, POLICY_WRITE
from aerospike_py_admin_ui_api.converters import raw_to_record
from aerospike_py_admin_ui_api.dependencies import AerospikeClient
from aerospike_py_admin_ui_api.models.record import (
    RecordListResponse,
    RecordWriteRequest,
)

logger = logging.getLogger(__name__)


def _auto_detect_pk(pk: str) -> str | int:
    """Convert PK to int if possible, matching Aerospike's key type semantics."""
    result: str | int = pk
    with contextlib.suppress(ValueError):
        result = int(pk)
    return result


router = APIRouter(prefix="/api/records", tags=["records"])


def _list_records_sync(c, ns: str, set_name: str, page: int, page_size: int) -> dict:
    q = c.query(ns, set_name)
    raw_results = q.results(POLICY_QUERY)

    if len(raw_results) > MAX_QUERY_RECORDS:
        raw_results = raw_results[:MAX_QUERY_RECORDS]

    total = len(raw_results)
    start = (page - 1) * page_size
    paged = raw_results[start : start + page_size]
    records = [raw_to_record(r) for r in paged]

    return {
        "records": records,
        "total": total,
        "page": page,
        "pageSize": page_size,
        "hasMore": start + page_size < total,
    }


@router.get(
    "/{conn_id}",
    summary="List records",
    description="Retrieve paginated records from a namespace and set.",
)
async def get_records(
    client: AerospikeClient,
    ns: str = Query(..., min_length=1),
    set: str = "",
    page: int = Query(1, ge=1),
    pageSize: int = Query(25, ge=1, le=500),
) -> RecordListResponse:
    """Retrieve paginated records from a namespace and set."""
    result = await asyncio.to_thread(_list_records_sync, client, ns, set, page, pageSize)
    return RecordListResponse(**result)


def _put_record_sync(c, body: RecordWriteRequest):
    k = body.key
    key_tuple = (k.namespace, k.set, _auto_detect_pk(k.pk))

    meta = None
    if body.ttl is not None:
        meta = {"ttl": body.ttl}

    c.put(key_tuple, body.bins, meta=meta, policy=POLICY_WRITE)
    result = c.get(key_tuple, policy=POLICY_READ)
    return raw_to_record(result)


@router.post(
    "/{conn_id}",
    status_code=201,
    summary="Create or update record",
    description="Write a record to Aerospike with the specified key, bins, and optional TTL.",
)
async def put_record(body: RecordWriteRequest, client: AerospikeClient):
    """Write a record to Aerospike with the specified key, bins, and optional TTL."""
    k = body.key
    if not k.namespace or not k.set or not k.pk:
        raise HTTPException(status_code=400, detail="Missing required key fields: namespace, set, pk")

    return await asyncio.to_thread(_put_record_sync, client, body)


def _delete_record_sync(c, ns: str, set_name: str, pk: str) -> None:
    c.remove((ns, set_name, _auto_detect_pk(pk)))


@router.delete(
    "/{conn_id}",
    summary="Delete record",
    description="Delete a record identified by namespace, set, and primary key.",
)
async def delete_record(
    client: AerospikeClient,
    ns: str = Query(..., min_length=1),
    set: str = Query(..., min_length=1),
    pk: str = Query(..., min_length=1),
) -> dict:
    """Delete a record identified by namespace, set, and primary key."""
    await asyncio.to_thread(_delete_record_sync, client, ns, set, pk)
    return {"message": "Record deleted"}
