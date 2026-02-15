from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class SecondaryIndex(BaseModel):
    name: str
    namespace: str
    set: str
    bin: str
    type: Literal["numeric", "string", "geo2dsphere"]
    state: Literal["ready", "building", "error"]


class CreateIndexRequest(BaseModel):
    namespace: str
    set: str
    bin: str
    name: str
    type: Literal["numeric", "string", "geo2dsphere"]
