from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from .record import AerospikeRecord, BinValue


class QueryPredicate(BaseModel):
    bin: str = Field(min_length=1)
    operator: Literal["equals", "between", "contains", "geo_within_region", "geo_contains_point"]
    value: BinValue
    value2: BinValue | None = None


class QueryRequest(BaseModel):
    namespace: str = Field(min_length=1)
    set: str | None = None
    predicate: QueryPredicate | None = None
    selectBins: list[str] | None = None
    expression: str | None = None
    maxRecords: int | None = Field(default=None, ge=1, le=1_000_000)
    primaryKey: str | None = None


class QueryResponse(BaseModel):
    records: list[AerospikeRecord]
    executionTimeMs: int = Field(ge=0)
    scannedRecords: int = Field(ge=0)
    returnedRecords: int = Field(ge=0)
