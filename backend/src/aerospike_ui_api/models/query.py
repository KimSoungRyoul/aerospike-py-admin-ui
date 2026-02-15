from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from .record import AerospikeRecord, BinValue


class QueryPredicate(BaseModel):
    bin: str
    operator: Literal["equals", "between", "contains", "geo_within_region", "geo_contains_point"]
    value: BinValue
    value2: BinValue | None = None


class QueryRequest(BaseModel):
    namespace: str
    set: str | None = None
    type: Literal["scan", "query"]
    predicate: QueryPredicate | None = None
    selectBins: list[str] | None = None
    expression: str | None = None
    maxRecords: int | None = None


class QueryResponse(BaseModel):
    records: list[AerospikeRecord]
    executionTimeMs: int
    scannedRecords: int
    returnedRecords: int
