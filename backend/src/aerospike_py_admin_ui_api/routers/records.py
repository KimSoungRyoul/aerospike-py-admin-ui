from __future__ import annotations

import asyncio

import aerospike_py
from fastapi import APIRouter, HTTPException, Query

from aerospike_py_admin_ui_api.client_manager import client_manager
from aerospike_py_admin_ui_api.converters import raw_to_record
from aerospike_py_admin_ui_api.models.record import RecordListResponse, RecordWriteRequest

router = APIRouter(prefix="/api/records", tags=["records"])

MAX_SCAN_RECORDS = 10_000


def _list_records_sync(conn_id: str, ns: str, set_name: str, page: int, page_size: int) -> dict:
    c = client_manager._get_client_sync(conn_id)
    scan = c.scan(ns, set_name)
    raw_results = scan.results({"total_timeout": 30000})

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
    conn_id: str,
    ns: str = "",
    set: str = "",
    page: int = Query(1, ge=1),
    pageSize: int = Query(25, ge=1),
) -> RecordListResponse:
    if not ns:
        raise HTTPException(status_code=400, detail="Missing required query param: ns")

    result = await asyncio.to_thread(_list_records_sync, conn_id, ns, set, page, pageSize)
    return RecordListResponse(**result)


def _put_record_sync(conn_id: str, body: RecordWriteRequest):
    c = client_manager._get_client_sync(conn_id)
    k = body.key
    key_tuple = (k.namespace, k.set, k.pk)

    meta = None
    if body.ttl is not None:
        meta = {"ttl": body.ttl}

    policy = {"key": aerospike_py.POLICY_KEY_SEND}
    c.put(key_tuple, body.bins, meta=meta, policy=policy)
    result = c.get(key_tuple, policy=policy)
    return raw_to_record(result)


@router.post("/{conn_id}", status_code=201)
async def put_record(conn_id: str, body: RecordWriteRequest):
    k = body.key
    if not k.namespace or not k.set or not k.pk:
        raise HTTPException(status_code=400, detail="Missing required key fields: namespace, set, pk")

    return await asyncio.to_thread(_put_record_sync, conn_id, body)


def _delete_record_sync(conn_id: str, ns: str, set_name: str, pk: str) -> None:
    c = client_manager._get_client_sync(conn_id)
    c.remove((ns, set_name, pk))


@router.delete("/{conn_id}")
async def delete_record(
    conn_id: str,
    ns: str = "",
    set: str = "",
    pk: str = "",
) -> dict:
    if not ns or not set or not pk:
        raise HTTPException(status_code=400, detail="Missing required query params: ns, set, pk")

    await asyncio.to_thread(_delete_record_sync, conn_id, ns, set, pk)
    return {"message": "Record deleted"}
