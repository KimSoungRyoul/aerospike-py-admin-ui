from __future__ import annotations

import random
import time

from aerospike_ui_api.mock_data.clusters import mock_clusters
from aerospike_ui_api.models.metrics import (
    ClusterMetrics,
    MetricPoint,
    MetricSeries,
    NamespaceMetrics,
)


def _generate_time_series(points: int, min_val: float, max_val: float) -> list[MetricPoint]:
    now = int(time.time() * 1000)
    interval_ms = 10_000
    series: list[MetricPoint] = []

    current = min_val + random.random() * (max_val - min_val)
    drift = (max_val - min_val) * 0.05

    for i in range(points):
        delta = (random.random() - 0.5) * 2 * drift
        current = max(min_val, min(max_val, current + delta))
        series.append(
            MetricPoint(
                timestamp=now - (points - 1 - i) * interval_ms,
                value=round(current * 100) / 100,
            )
        )
    return series


def generate_cluster_metrics(conn_id: str) -> ClusterMetrics:
    cluster = mock_clusters.get(conn_id)
    nodes = cluster.nodes if cluster else []
    namespaces = cluster.namespaces if cluster else []

    total_connections = sum(n.clientConnections for n in nodes)
    uptime = nodes[0].uptime if nodes else 0

    ts_points = 60
    ns_metrics: list[NamespaceMetrics] = []
    memory_usage_by_ns: list[MetricSeries] = []
    device_usage_by_ns: list[MetricSeries] = []
    ns_colors = ["#0097D3", "#ffe600", "#ff6b35", "#2ecc71", "#9b59b6"]

    for i, ns in enumerate(namespaces):
        read_reqs = random.randint(50_000, 200_000)
        write_reqs = random.randint(20_000, 100_000)
        ns_metrics.append(
            NamespaceMetrics(
                namespace=ns.name,
                objects=ns.objects,
                memoryUsed=ns.memoryUsed,
                memoryTotal=ns.memoryTotal,
                deviceUsed=ns.deviceUsed,
                deviceTotal=ns.deviceTotal,
                readReqs=read_reqs,
                writeReqs=write_reqs,
                readSuccess=read_reqs - random.randint(0, 500),
                writeSuccess=write_reqs - random.randint(0, 200),
            )
        )

        mem_pct = (ns.memoryUsed / ns.memoryTotal) * 100
        memory_usage_by_ns.append(
            MetricSeries(
                name=f"memory_{ns.name}",
                label=f"{ns.name} memory",
                data=_generate_time_series(ts_points, mem_pct - 3, mem_pct + 3),
                color=ns_colors[i % len(ns_colors)],
            )
        )

        dev_pct = (ns.deviceUsed / ns.deviceTotal) * 100
        device_usage_by_ns.append(
            MetricSeries(
                name=f"device_{ns.name}",
                label=f"{ns.name} device",
                data=_generate_time_series(ts_points, dev_pct - 2, dev_pct + 2),
                color=ns_colors[i % len(ns_colors)],
            )
        )

    is_small = len(nodes) <= 1
    read_tps = (100, 500) if is_small else (300, 1500)
    write_tps = (50, 200) if is_small else (150, 800)

    return ClusterMetrics(
        connectionId=conn_id,
        timestamp=int(time.time() * 1000),
        connected=True,
        uptime=uptime,
        clientConnections=total_connections,
        totalReadReqs=sum(n.readReqs for n in ns_metrics),
        totalWriteReqs=sum(n.writeReqs for n in ns_metrics),
        totalReadSuccess=sum(n.readSuccess for n in ns_metrics),
        totalWriteSuccess=sum(n.writeSuccess for n in ns_metrics),
        namespaces=ns_metrics,
        readTps=_generate_time_series(ts_points, *read_tps),
        writeTps=_generate_time_series(ts_points, *write_tps),
        connectionHistory=_generate_time_series(
            ts_points,
            10 if is_small else 30,
            50 if is_small else 120,
        ),
        memoryUsageByNs=memory_usage_by_ns,
        deviceUsageByNs=device_usage_by_ns,
    )
