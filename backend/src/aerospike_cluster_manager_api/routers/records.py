from __future__ import annotations

import contextlib
import logging

from fastapi import APIRouter, HTTPException, Query
from starlette.responses import Response

from aerospike_cluster_manager_api.constants import MAX_QUERY_RECORDS, POLICY_QUERY, POLICY_READ, POLICY_WRITE
from aerospike_cluster_manager_api.converters import record_to_model
from aerospike_cluster_manager_api.dependencies import AerospikeClient
from aerospike_cluster_manager_api.models.record import (
    AerospikeRecord,
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
    q = client.query(ns, set)
    raw_results = await q.results(POLICY_QUERY)

    if len(raw_results) > MAX_QUERY_RECORDS:
        raw_results = raw_results[:MAX_QUERY_RECORDS]

    total = len(raw_results)
    start = (page - 1) * pageSize
    paged = raw_results[start : start + pageSize]
    records = [record_to_model(r) for r in paged]

    return RecordListResponse(
        records=records,
        total=total,
        page=page,
        pageSize=pageSize,
        hasMore=start + pageSize < total,
    )


@router.post(
    "/{conn_id}",
    status_code=201,
    summary="Create or update record",
    description="Write a record to Aerospike with the specified key, bins, and optional TTL.",
)
async def put_record(body: RecordWriteRequest, client: AerospikeClient) -> AerospikeRecord:
    """Write a record to Aerospike with the specified key, bins, and optional TTL."""
    k = body.key
    if not k.namespace or not k.set or not k.pk:
        raise HTTPException(status_code=400, detail="Missing required key fields: namespace, set, pk")

    key_tuple = (k.namespace, k.set, _auto_detect_pk(k.pk))

    meta = None
    if body.ttl is not None:
        meta = {"ttl": body.ttl}

    await client.put(key_tuple, body.bins, meta=meta, policy=POLICY_WRITE)
    result = await client.get(key_tuple, policy=POLICY_READ)
    return record_to_model(result)


@router.delete(
    "/{conn_id}",
    status_code=204,
    summary="Delete record",
    description="Delete a record identified by namespace, set, and primary key.",
)
async def delete_record(
    client: AerospikeClient,
    ns: str = Query(..., min_length=1),
    set: str = Query(..., min_length=1),
    pk: str = Query(..., min_length=1),
) -> Response:
    """Delete a record identified by namespace, set, and primary key."""
    await client.remove((ns, set, _auto_detect_pk(pk)))
    return Response(status_code=204)
