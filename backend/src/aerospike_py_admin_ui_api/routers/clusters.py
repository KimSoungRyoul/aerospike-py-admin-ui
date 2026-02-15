from __future__ import annotations

import asyncio

from fastapi import APIRouter, HTTPException

from aerospike_py_admin_ui_api import db
from aerospike_py_admin_ui_api.client_manager import client_manager
from aerospike_py_admin_ui_api.info_parser import parse_kv_pairs, parse_list, parse_records, safe_bool, safe_int
from aerospike_py_admin_ui_api.models.cluster import ClusterInfo, ClusterNode, NamespaceInfo, SetInfo

router = APIRouter(prefix="/api/clusters", tags=["clusters"])


def _fetch_cluster_sync(conn_id: str) -> ClusterInfo:
    c = client_manager._get_client_sync(conn_id)

    # --- Nodes ---
    node_names = c.get_node_names()
    info_all_stats = c.info_all("statistics")
    info_all_build = c.info_all("build")
    info_all_edition = c.info_all("edition")
    info_all_service = c.info_all("service")

    node_map: dict[str, dict] = {}
    for name, _err, resp in info_all_stats:
        node_map.setdefault(name, {})["stats"] = parse_kv_pairs(resp)
    for name, _err, resp in info_all_build:
        node_map.setdefault(name, {})["build"] = resp.strip()
    for name, _err, resp in info_all_edition:
        node_map.setdefault(name, {})["edition"] = resp.strip()
    for name, _err, resp in info_all_service:
        node_map.setdefault(name, {})["service"] = resp.strip()

    nodes: list[ClusterNode] = []
    for name in node_names:
        info = node_map.get(name, {})
        stats = info.get("stats", {})
        service = info.get("service", "")
        addr, port = ([*service.split(":"), "3000"])[:2] if service else ("", "3000")

        nodes.append(
            ClusterNode(
                name=name,
                address=addr,
                port=safe_int(port, 3000),
                build=info.get("build", ""),
                edition=info.get("edition", ""),
                clusterSize=safe_int(stats.get("cluster_size"), 1),
                uptime=safe_int(stats.get("uptime")),
                clientConnections=safe_int(stats.get("client_connections")),
                statistics=stats,
            )
        )

    # --- Namespaces ---
    ns_raw = c.info_random_node("namespaces")
    ns_names = parse_list(ns_raw)

    namespaces: list[NamespaceInfo] = []
    for ns_name in ns_names:
        ns_info_raw = c.info_random_node(f"namespace/{ns_name}")
        ns_stats = parse_kv_pairs(ns_info_raw)

        memory_used = safe_int(ns_stats.get("memory_used_bytes"))
        memory_total = safe_int(ns_stats.get("memory-size"))
        device_used = safe_int(ns_stats.get("device_used_bytes"))
        device_total = safe_int(ns_stats.get("device-total-bytes"))

        memory_free_pct = 0
        if memory_total > 0:
            memory_free_pct = int((1 - memory_used / memory_total) * 100)

        # --- Sets for this namespace ---
        sets_raw = c.info_random_node(f"sets/{ns_name}")
        set_records = parse_records(sets_raw)
        sets: list[SetInfo] = []
        for sr in set_records:
            sets.append(
                SetInfo(
                    name=sr.get("set", sr.get("set_name", "")),
                    namespace=ns_name,
                    objects=safe_int(sr.get("objects")),
                    tombstones=safe_int(sr.get("tombstones")),
                    memoryDataBytes=safe_int(sr.get("memory_data_bytes")),
                    stopWritesCount=safe_int(sr.get("stop-writes-count", sr.get("stop_writes_count"))),
                )
            )

        namespaces.append(
            NamespaceInfo(
                name=ns_name,
                objects=safe_int(ns_stats.get("objects")),
                memoryUsed=memory_used,
                memoryTotal=memory_total,
                memoryFreePct=memory_free_pct,
                deviceUsed=device_used,
                deviceTotal=device_total,
                replicationFactor=safe_int(ns_stats.get("replication-factor"), 1),
                stopWrites=safe_bool(ns_stats.get("stop_writes")),
                hwmBreached=safe_bool(ns_stats.get("hwm_breached")),
                highWaterMemoryPct=safe_int(ns_stats.get("high-water-memory-pct")),
                highWaterDiskPct=safe_int(ns_stats.get("high-water-disk-pct")),
                sets=sets,
            )
        )

    return ClusterInfo(connectionId=conn_id, nodes=nodes, namespaces=namespaces)


@router.get("/{conn_id}")
async def get_cluster(conn_id: str) -> ClusterInfo:
    conn = await db.get_connection(conn_id)
    if not conn:
        raise HTTPException(status_code=404, detail=f"Connection '{conn_id}' not found")

    return await asyncio.to_thread(_fetch_cluster_sync, conn_id)
