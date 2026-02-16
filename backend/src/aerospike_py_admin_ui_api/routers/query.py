from __future__ import annotations

import asyncio
import json
import time

from aerospike_py import INDEX_TYPE_LIST, predicates
from fastapi import APIRouter, Depends

from aerospike_py_admin_ui_api.client_manager import client_manager
from aerospike_py_admin_ui_api.constants import MAX_QUERY_RECORDS
from aerospike_py_admin_ui_api.converters import raw_to_record
from aerospike_py_admin_ui_api.dependencies import _get_verified_connection
from aerospike_py_admin_ui_api.models.query import QueryRequest, QueryResponse

router = APIRouter(prefix="/api/query", tags=["query"])


def _build_predicate(pred):
    op = pred.operator
    if op == "equals":
        return predicates.equals(pred.bin, pred.value)
    if op == "between":
        return predicates.between(pred.bin, pred.value, pred.value2)
    if op == "contains":
        return predicates.contains(pred.bin, INDEX_TYPE_LIST, pred.value)
    if op == "geo_within_region":
        geo = pred.value if isinstance(pred.value, str) else json.dumps(pred.value)
        return predicates.geo_within_geojson_region(pred.bin, geo)
    if op == "geo_contains_point":
        geo = pred.value if isinstance(pred.value, str) else json.dumps(pred.value)
        return predicates.geo_contains_geojson_point(pred.bin, geo)
    raise ValueError(f"Unknown predicate operator: {op}")


def _execute_query_sync(conn_id: str, body: QueryRequest) -> dict:
    c = client_manager._get_client_sync(conn_id)
    start_time = time.monotonic()

    if body.type == "query" and body.predicate:
        q = c.query(body.namespace, body.set or "")
        q.where(_build_predicate(body.predicate))
        if body.selectBins:
            q.select(*body.selectBins)
        raw_results = q.results({"total_timeout": 30000})
    else:
        scan = c.scan(body.namespace, body.set or "")
        if body.selectBins:
            scan.select(*body.selectBins)
        raw_results = scan.results({"total_timeout": 30000})

    elapsed_ms = int((time.monotonic() - start_time) * 1000)
    scanned = len(raw_results)

    if body.maxRecords and body.maxRecords > 0:
        raw_results = raw_results[: body.maxRecords]
    if len(raw_results) > MAX_QUERY_RECORDS:
        raw_results = raw_results[:MAX_QUERY_RECORDS]

    records = [raw_to_record(r) for r in raw_results]

    return {
        "records": records,
        "executionTimeMs": elapsed_ms,
        "scannedRecords": scanned,
        "returnedRecords": len(records),
    }


@router.post("/{conn_id}")
async def execute_query(
    body: QueryRequest,
    conn_id: str = Depends(_get_verified_connection),
) -> QueryResponse:
    result = await asyncio.to_thread(_execute_query_sync, conn_id, body)
    return QueryResponse(**result)
