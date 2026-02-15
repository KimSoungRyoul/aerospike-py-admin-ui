from __future__ import annotations

import random
import time

from fastapi import APIRouter, HTTPException, Query

from aerospike_py_admin_ui_api import store
from aerospike_py_admin_ui_api.models.record import (
    AerospikeRecord,
    RecordKey,
    RecordListResponse,
    RecordMeta,
    RecordWriteRequest,
)

router = APIRouter(prefix="/api/records", tags=["records"])


@router.get("/{conn_id}")
def get_records(
    conn_id: str,
    ns: str = "",
    set: str = "",
    page: int = Query(1, ge=1),
    pageSize: int = Query(25, ge=1),
) -> RecordListResponse:
    key = f"{ns}:{set}"
    conn_records = store.records.get(conn_id, {}).get(key, [])
    total = len(conn_records)
    start = (page - 1) * pageSize
    paged = conn_records[start : start + pageSize]

    return RecordListResponse(
        records=paged,
        total=total,
        page=page,
        pageSize=pageSize,
        hasMore=start + pageSize < total,
    )


@router.post("/{conn_id}", status_code=201)
def put_record(conn_id: str, body: RecordWriteRequest) -> AerospikeRecord:
    k = body.key
    if not k.namespace or not k.set or not k.pk:
        raise HTTPException(
            status_code=400,
            detail="Missing required key fields: namespace, set, pk",
        )

    store_key = f"{k.namespace}:{k.set}"
    if conn_id not in store.records:
        store.records[conn_id] = {}
    if store_key not in store.records[conn_id]:
        store.records[conn_id][store_key] = []

    recs = store.records[conn_id][store_key]
    existing_idx = next(
        (i for i, r in enumerate(recs) if r.key.namespace == k.namespace and r.key.set == k.set and r.key.pk == k.pk),
        -1,
    )

    record = AerospikeRecord(
        key=RecordKey(
            namespace=k.namespace,
            set=k.set,
            pk=k.pk,
            digest=k.digest or f"{random.getrandbits(128):032x}"[:40],
        ),
        meta=RecordMeta(
            generation=(recs[existing_idx].meta.generation + 1) if existing_idx >= 0 else 1,
            ttl=body.ttl if body.ttl is not None else -1,
            lastUpdateMs=int(time.time() * 1000),
        ),
        bins=body.bins,
    )

    if existing_idx >= 0:
        recs[existing_idx] = record
    else:
        recs.append(record)

    return record


@router.delete("/{conn_id}")
def delete_record(
    conn_id: str,
    ns: str = "",
    set: str = "",
    pk: str = "",
) -> dict:
    if not ns or not set or not pk:
        raise HTTPException(
            status_code=400,
            detail="Missing required query params: ns, set, pk",
        )

    store_key = f"{ns}:{set}"
    recs = store.records.get(conn_id, {}).get(store_key)
    if not recs:
        raise HTTPException(status_code=404, detail="Record not found")

    idx = next(
        (i for i, r in enumerate(recs) if r.key.namespace == ns and r.key.set == set and r.key.pk == pk),
        -1,
    )
    if idx == -1:
        raise HTTPException(status_code=404, detail="Record not found")

    recs.pop(idx)
    return {"message": "Record deleted"}
