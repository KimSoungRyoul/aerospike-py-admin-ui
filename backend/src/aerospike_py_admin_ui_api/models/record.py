from __future__ import annotations

from typing import Any

from pydantic import BaseModel

BinValue = Any


class GeoJSON(BaseModel):
    type: str  # "Point" | "Polygon" | "AeroCircle"
    coordinates: list[Any]


class RecordKey(BaseModel):
    namespace: str
    set: str
    pk: str
    digest: str | None = None


class RecordMeta(BaseModel):
    generation: int
    ttl: int
    lastUpdateMs: int | None = None


class AerospikeRecord(BaseModel):
    key: RecordKey
    meta: RecordMeta
    bins: dict[str, BinValue]


class RecordListResponse(BaseModel):
    records: list[AerospikeRecord]
    total: int
    page: int
    pageSize: int
    hasMore: bool


class RecordWriteRequest(BaseModel):
    key: RecordKey
    bins: dict[str, BinValue]
    ttl: int | None = None
