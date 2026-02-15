from fastapi import APIRouter

from aerospike_ui_api.models.metrics import ClusterMetrics
from aerospike_ui_api.mock_data.metrics import generate_cluster_metrics

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("/{conn_id}")
def get_metrics(conn_id: str) -> ClusterMetrics:
    return generate_cluster_metrics(conn_id)
