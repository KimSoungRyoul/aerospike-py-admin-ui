from __future__ import annotations

import json
import logging
import time

from aerospike_py import INDEX_TYPE_LIST, predicates
from aerospike_py.exception import RecordNotFound
from fastapi import APIRouter

from aerospike_cluster_manager_api.constants import MAX_QUERY_RECORDS, POLICY_QUERY, POLICY_READ
from aerospike_cluster_manager_api.converters import record_to_model
from aerospike_cluster_manager_api.dependencies import AerospikeClient
from aerospike_cluster_manager_api.models.query import QueryPredicate, QueryRequest, QueryResponse
from aerospike_cluster_manager_api.routers.records import _auto_detect_pk

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/query", tags=["query"])


def _build_predicate(pred: QueryPredicate) -> tuple[str, ...]:
    """Convert a QueryPredicate model into an Aerospike predicate tuple."""
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


@router.post(
    "/{conn_id}",
    summary="Execute query",
    description="Execute a query against Aerospike using primary key lookup, predicate filter, or full scan.",
)
async def execute_query(body: QueryRequest, client: AerospikeClient) -> QueryResponse:
    """Execute a query against Aerospike using primary key lookup, predicate filter, or full scan."""
    start_time = time.monotonic()

    if body.primaryKey:
        if not body.set:
            raise ValueError("Set is required for PK Query")

        pk = _auto_detect_pk(body.primaryKey)

        try:
            raw_result = await client.get((body.namespace, body.set, pk), policy=POLICY_READ)
            raw_results = [raw_result]
        except RecordNotFound:
            raw_results = []

        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        records = [record_to_model(r) for r in raw_results]
        return QueryResponse(
            records=records,
            executionTimeMs=elapsed_ms,
            scannedRecords=len(records),
            returnedRecords=len(records),
        )

    q = client.query(body.namespace, body.set or "")
    if body.predicate:
        q.where(_build_predicate(body.predicate))
    if body.selectBins:
        q.select(*body.selectBins)
    raw_results = await q.results(POLICY_QUERY)

    elapsed_ms = int((time.monotonic() - start_time) * 1000)
    scanned = len(raw_results)

    if body.maxRecords and body.maxRecords > 0:
        raw_results = raw_results[: body.maxRecords]
    if len(raw_results) > MAX_QUERY_RECORDS:
        raw_results = raw_results[:MAX_QUERY_RECORDS]

    records = [record_to_model(r) for r in raw_results]

    return QueryResponse(
        records=records,
        executionTimeMs=elapsed_ms,
        scannedRecords=scanned,
        returnedRecords=len(records),
    )
