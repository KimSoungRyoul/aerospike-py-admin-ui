from __future__ import annotations

from pydantic import BaseModel


class ClusterNode(BaseModel):
    name: str
    address: str
    port: int
    build: str
    edition: str
    clusterSize: int
    uptime: int
    clientConnections: int
    statistics: dict[str, str | int]


class SetInfo(BaseModel):
    name: str
    namespace: str
    objects: int
    tombstones: int
    memoryDataBytes: int
    stopWritesCount: int


class NamespaceInfo(BaseModel):
    name: str
    objects: int
    memoryUsed: int
    memoryTotal: int
    memoryFreePct: int
    deviceUsed: int
    deviceTotal: int
    replicationFactor: int
    stopWrites: bool
    hwmBreached: bool
    highWaterMemoryPct: int
    highWaterDiskPct: int
    sets: list[SetInfo]


class ClusterInfo(BaseModel):
    connectionId: str
    nodes: list[ClusterNode]
    namespaces: list[NamespaceInfo]
