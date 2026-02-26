from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class AerospikeNamespaceStorage(BaseModel):
    type: Literal["memory", "device"] = Field(default="memory", description="memory or device")
    data_size: int | None = Field(default=1073741824, alias="dataSize", description="For memory type, in bytes")
    file: str | None = Field(default=None, description="For device type, data file path")
    filesize: int | None = Field(default=None, description="For device type, max data file size in bytes")


class AerospikeNamespaceConfig(BaseModel):
    name: str = Field(default="test", min_length=1, max_length=63)
    replication_factor: int = Field(default=1, ge=1, le=8, alias="replicationFactor")
    storage_engine: AerospikeNamespaceStorage = Field(default_factory=AerospikeNamespaceStorage, alias="storageEngine")


class StorageVolumeConfig(BaseModel):
    storage_class: str = Field(default="standard", alias="storageClass")
    size: str = Field(default="10Gi", pattern=r"^[0-9]+[KMGTPE]i$")
    mount_path: str = Field(default="/opt/aerospike/data", alias="mountPath")


class ResourceSpec(BaseModel):
    cpu: str = Field(default="1", pattern=r"^[0-9]+(\.[0-9]+)?m?$")
    memory: str = Field(default="2Gi", pattern=r"^[0-9]+(\.[0-9]+)?[KMGTPE]?i?$")


class ResourceConfig(BaseModel):
    requests: ResourceSpec = Field(default_factory=lambda: ResourceSpec(cpu="500m", memory="1Gi"))
    limits: ResourceSpec = Field(default_factory=lambda: ResourceSpec(cpu="2", memory="4Gi"))


class CreateK8sClusterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=63, pattern=r"^[a-z0-9]([a-z0-9\-]*[a-z0-9])?$")
    namespace: str = Field(
        default="aerospike",
        min_length=1,
        max_length=253,
        pattern=r"^[a-z0-9]([a-z0-9\-]*[a-z0-9])?$",
    )
    size: int = Field(ge=1, le=8)
    image: str = Field(
        default="aerospike:ce-8.1.1.1",
        pattern=r"^[a-z0-9]([a-z0-9._/-]*[a-z0-9])?:[a-zA-Z0-9._-]+$",
    )
    namespaces: list[AerospikeNamespaceConfig] = Field(
        default_factory=lambda: [AerospikeNamespaceConfig()],
        max_length=5,
    )
    storage: StorageVolumeConfig | None = None
    resources: ResourceConfig | None = None
    auto_connect: bool = Field(default=True, alias="autoConnect")

    model_config = {"populate_by_name": True}


class UpdateK8sClusterRequest(BaseModel):
    size: int | None = Field(default=None, ge=1, le=8)
    image: str | None = Field(
        default=None,
        pattern=r"^[a-z0-9]([a-z0-9._/-]*[a-z0-9])?:[a-zA-Z0-9._-]+$",
    )
    resources: ResourceConfig | None = None

    model_config = {"populate_by_name": True}


class ScaleK8sClusterRequest(BaseModel):
    size: int = Field(ge=1, le=8)


class K8sPodStatus(BaseModel):
    name: str
    podIP: str | None = None
    hostIP: str | None = None
    isReady: bool = False
    phase: str = "Unknown"
    image: str | None = None


class K8sClusterSummary(BaseModel):
    name: str = Field(min_length=1)
    namespace: str = Field(min_length=1)
    size: int
    image: str
    phase: str = "Unknown"
    age: str | None = None
    connectionId: str | None = None


class K8sClusterDetail(BaseModel):
    name: str
    namespace: str
    size: int
    image: str
    phase: str = "Unknown"
    age: str | None = None
    spec: dict = Field(default_factory=dict)
    status: dict = Field(default_factory=dict)
    pods: list[K8sPodStatus] = Field(default_factory=list)
    connectionId: str | None = None
