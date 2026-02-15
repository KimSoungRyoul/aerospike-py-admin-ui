from __future__ import annotations

import random

from fastapi import APIRouter, HTTPException

from aerospike_py_admin_ui_api import store
from aerospike_py_admin_ui_api.models.query import QueryRequest, QueryResponse
from aerospike_py_admin_ui_api.models.record import AerospikeRecord

router = APIRouter(prefix="/api/query", tags=["query"])


def _matches_predicate(record: AerospikeRecord, predicate) -> bool:
    if predicate is None:
        return True

    bin_value = record.bins.get(predicate.bin)
    if bin_value is None:
        return False

    op = predicate.operator

    if op == "equals":
        return bin_value == predicate.value

    if op == "between":
        if not (
            isinstance(bin_value, int | float)
            and isinstance(predicate.value, int | float)
            and isinstance(predicate.value2, int | float)
        ):
            return False
        return predicate.value <= bin_value <= predicate.value2

    if op == "contains":
        if isinstance(bin_value, str) and isinstance(predicate.value, str):
            return predicate.value.lower() in bin_value.lower()
        if isinstance(bin_value, list):
            return predicate.value in bin_value
        return False

    if op in ("geo_within_region", "geo_contains_point"):
        return isinstance(bin_value, dict) and "type" in bin_value and "coordinates" in bin_value

    return True


@router.post("/{conn_id}")
def execute_query(conn_id: str, body: QueryRequest) -> QueryResponse:
    conn_records = store.records.get(conn_id)
    if not conn_records:
        raise HTTPException(status_code=404, detail=f"No data for connection '{conn_id}'")

    all_records: list[AerospikeRecord] = []
    for key, recs in conn_records.items():
        rec_ns, rec_set = key.split(":")
        if rec_ns != body.namespace:
            continue
        if body.set and rec_set != body.set:
            continue
        all_records.extend(recs)

    scanned = len(all_records)

    if body.type == "query" and body.predicate:
        filtered = [r for r in all_records if _matches_predicate(r, body.predicate)]
    else:
        filtered = all_records

    if body.maxRecords and body.maxRecords > 0:
        filtered = filtered[: body.maxRecords]

    if body.selectBins:
        select = set(body.selectBins)
        filtered = [r.model_copy(update={"bins": {k: v for k, v in r.bins.items() if k in select}}) for r in filtered]

    return QueryResponse(
        records=filtered,
        executionTimeMs=random.randint(5, 50),
        scannedRecords=scanned,
        returnedRecords=len(filtered),
    )
