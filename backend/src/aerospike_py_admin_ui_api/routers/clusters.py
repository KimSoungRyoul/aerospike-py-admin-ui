from fastapi import APIRouter, HTTPException

from aerospike_py_admin_ui_api import store
from aerospike_py_admin_ui_api.models.cluster import ClusterInfo

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
