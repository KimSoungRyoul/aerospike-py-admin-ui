from __future__ import annotations

from pydantic import BaseModel


class TerminalCommand(BaseModel):
    id: str
    command: str
    output: str
    timestamp: str
    success: bool


class TerminalRequest(BaseModel):
    command: str
