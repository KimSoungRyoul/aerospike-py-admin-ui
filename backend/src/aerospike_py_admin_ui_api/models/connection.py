from __future__ import annotations

from pydantic import BaseModel


class ConnectionStatus(BaseModel):
    connected: bool
    nodeCount: int
    namespaceCount: int
    build: str | None = None
    edition: str | None = None


class ConnectionProfile(BaseModel):
    id: str
    name: str
    hosts: list[str]
    port: int
    clusterName: str | None = None
    username: str | None = None
    password: str | None = None
    color: str
    createdAt: str
    updatedAt: str


class ConnectionWithStatus(ConnectionProfile):
    status: ConnectionStatus
