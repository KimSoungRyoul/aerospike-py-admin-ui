from __future__ import annotations

import asyncio

from fastapi import APIRouter, HTTPException, Query

from aerospike_py_admin_ui_api.constants import MAX_SCAN_RECORDS, POLICY_READ, POLICY_SCAN, POLICY_WRITE
from aerospike_py_admin_ui_api.converters import raw_to_record
from aerospike_py_admin_ui_api.dependencies import AerospikeClient
from aerospike_py_admin_ui_api.models.record import (
    RecordListResponse,
    RecordWriteRequest,
)

router = APIRouter(prefix="/api/records", tags=["records"])


def _list_records_sync(c, ns: str, set_name: str, page: int, page_size: int) -> dict:
    scan = c.scan(ns, set_name)
    raw_results = scan.results(POLICY_SCAN)

    if len(raw_results) > MAX_SCAN_RECORDS:
        raw_results = raw_results[:MAX_SCAN_RECORDS]

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


@router.get("/{conn_id}")
async def get_records(
    client: AerospikeClient,
    ns: str = Query(..., min_length=1),
    set: str = "",
    page: int = Query(1, ge=1),
    pageSize: int = Query(25, ge=1, le=500),
) -> RecordListResponse:
    result = await asyncio.to_thread(_list_records_sync, client, ns, set, page, pageSize)
    return RecordListResponse(**result)


def _put_record_sync(c, body: RecordWriteRequest):
    k = body.key
    key_tuple = (k.namespace, k.set, k.pk)

    meta = None
    if body.ttl is not None:
        meta = {"ttl": body.ttl}

    c.put(key_tuple, body.bins, meta=meta, policy=POLICY_WRITE)
    result = c.get(key_tuple, policy=POLICY_READ)
    return raw_to_record(result)


@router.post("/{conn_id}", status_code=201)
async def put_record(body: RecordWriteRequest, client: AerospikeClient):
    k = body.key
    if not k.namespace or not k.set or not k.pk:
        raise HTTPException(status_code=400, detail="Missing required key fields: namespace, set, pk")

    return await asyncio.to_thread(_put_record_sync, client, body)


def _delete_record_sync(c, ns: str, set_name: str, pk: str) -> None:
    c.remove((ns, set_name, pk))


@router.delete("/{conn_id}")
async def delete_record(
    client: AerospikeClient,
    ns: str = Query(..., min_length=1),
    set: str = Query(..., min_length=1),
    pk: str = Query(..., min_length=1),
) -> dict:
    await asyncio.to_thread(_delete_record_sync, client, ns, set, pk)
    return {"message": "Record deleted"}
