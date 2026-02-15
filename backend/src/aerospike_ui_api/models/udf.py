from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class UDFModule(BaseModel):
    filename: str
    type: Literal["LUA"] = "LUA"
    hash: str
    content: str | None = None
