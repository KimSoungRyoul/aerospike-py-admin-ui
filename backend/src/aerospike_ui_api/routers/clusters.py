from fastapi import APIRouter, HTTPException

from aerospike_ui_api.models.cluster import ClusterInfo
from aerospike_ui_api import store

router = APIRouter(prefix="/api/clusters", tags=["clusters"])


@router.get("/{conn_id}")
def get_cluster(conn_id: str) -> ClusterInfo:
    cluster = store.clusters.get(conn_id)
    if not cluster:
        raise HTTPException(
            status_code=404,
            detail=f"Cluster info for connection '{conn_id}' not found",
        )
    return cluster
