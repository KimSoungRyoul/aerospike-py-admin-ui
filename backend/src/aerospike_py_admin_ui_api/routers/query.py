from __future__ import annotations

import asyncio
import json
import time

from aerospike_py import INDEX_TYPE_LIST, predicates
from aerospike_py.exception import RecordNotFound
from fastapi import APIRouter

from aerospike_py_admin_ui_api.constants import MAX_QUERY_RECORDS, POLICY_QUERY, POLICY_READ, POLICY_SCAN
from aerospike_py_admin_ui_api.converters import raw_to_record
from aerospike_py_admin_ui_api.dependencies import AerospikeClient
from aerospike_py_admin_ui_api.models.query import QueryRequest, QueryResponse
from aerospike_py_admin_ui_api.routers.records import _auto_detect_pk

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


def _execute_query_sync(c, body: QueryRequest) -> dict:
    start_time = time.monotonic()

    if body.type == "pk":
        if not body.set:
            raise ValueError("Set is required for PK Query")
        if not body.primaryKey:
            raise ValueError("Primary key is required for PK Query")

        # Aerospike treats string "123" and int 123 as different keys
        pk = _auto_detect_pk(body.primaryKey)

        try:
            raw_result = c.get((body.namespace, body.set, pk), policy=POLICY_READ)
            raw_results = [raw_result]
        except RecordNotFound:
            raw_results = []

        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        records = [raw_to_record(r) for r in raw_results]
        return {
            "records": records,
            "executionTimeMs": elapsed_ms,
            "scannedRecords": len(records),
            "returnedRecords": len(records),
        }

    if body.type == "query" and body.predicate:
        q = c.query(body.namespace, body.set or "")
        q.where(_build_predicate(body.predicate))
        if body.selectBins:
            q.select(*body.selectBins)
        raw_results = q.results(POLICY_QUERY)
    else:
        scan = c.scan(body.namespace, body.set or "")
        if body.selectBins:
            scan.select(*body.selectBins)
        raw_results = scan.results(POLICY_SCAN)

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
async def execute_query(body: QueryRequest, client: AerospikeClient) -> QueryResponse:
    result = await asyncio.to_thread(_execute_query_sync, client, body)
    return QueryResponse(**result)
