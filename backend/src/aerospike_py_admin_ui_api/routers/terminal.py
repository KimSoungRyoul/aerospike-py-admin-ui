from __future__ import annotations

import asyncio
import random
import time
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException

from aerospike_py_admin_ui_api.client_manager import client_manager
from aerospike_py_admin_ui_api.info_parser import parse_kv_pairs, parse_list, parse_records
from aerospike_py_admin_ui_api.models.terminal import TerminalCommand, TerminalRequest

router = APIRouter(prefix="/api/terminal", tags=["terminal"])


def _execute_sync(conn_id: str, command: str) -> tuple[str, bool]:
    """Execute a terminal command against Aerospike. Returns (output, success)."""
    c = client_manager._get_client_sync(conn_id)
    lower = command.lower()

    if lower == "show namespaces":
        ns_raw = c.info_random_node("namespaces")
        ns_list = parse_list(ns_raw)
        if not ns_list:
            return "(no namespaces)", True
        lines = [f"  {ns}" for ns in ns_list]
        return "Namespaces:\n" + "\n".join(lines), True

    if lower == "show sets":
        ns_raw = c.info_random_node("namespaces")
        ns_list = parse_list(ns_raw)
        set_lines: list[str] = []
        for ns in ns_list:
            sets_raw = c.info_random_node(f"sets/{ns}")
            for rec in parse_records(sets_raw):
                set_name = rec.get("set", rec.get("set_name", ""))
                objects = rec.get("objects", "0")
                tombstones = rec.get("tombstones", "0")
                set_lines.append(f"  {ns}.{set_name}  objects={objects}  tombstones={tombstones}")
        return "Sets:\n" + "\n".join(set_lines) if set_lines else "(no sets)", True

    if lower == "show bins":
        ns_raw = c.info_random_node("namespaces")
        ns_list = parse_list(ns_raw)
        all_bins: list[str] = []
        for ns in ns_list:
            bins_raw = c.info_random_node(f"bins/{ns}")
            bins_info = parse_kv_pairs(bins_raw, sep=",")
            for k in bins_info:
                if k.startswith("bin_names"):
                    all_bins.extend(bins_info[k].split(","))
                elif k not in ("num", "quota"):
                    all_bins.append(k)
        if all_bins:
            return "Bins:\n" + "\n".join(f"  {b}" for b in sorted(set(all_bins))), True
        return "(no bins)", True

    if lower == "show indexes" or lower == "show sindex":
        ns_raw = c.info_random_node("namespaces")
        ns_list = parse_list(ns_raw)
        idx_lines: list[str] = []
        for ns in ns_list:
            sindex_raw = c.info_random_node(f"sindex/{ns}")
            for rec in parse_records(sindex_raw):
                name = rec.get("indexname", rec.get("index_name", ""))
                bin_name = rec.get("bin", rec.get("bin_name", ""))
                idx_type = rec.get("type", rec.get("bin_type", ""))
                state = rec.get("state", "")
                idx_lines.append(f"  {ns}.{name}  bin={bin_name}  type={idx_type}  state={state}")
        return "Indexes:\n" + "\n".join(idx_lines) if idx_lines else "(no indexes)", True

    if lower == "status":
        resp = c.info_random_node("status")
        return resp.strip(), True

    if lower == "build":
        build = c.info_random_node("build").strip()
        edition = c.info_random_node("edition").strip()
        return f"{edition} {build}", True

    if lower == "node":
        resp = c.info_random_node("node")
        return resp.strip(), True

    if lower == "statistics":
        raw = c.info_random_node("statistics")
        stats = parse_kv_pairs(raw)
        lines = [f"  {k}={v}" for k, v in sorted(stats.items())]
        return "Statistics:\n" + "\n".join(lines), True

    # Fallback: try as raw info command
    try:
        resp = c.info_random_node(command)
        return resp.strip() if resp.strip() else "(empty response)", True
    except Exception as e:
        return f"Error: {e}", False


@router.post("/{conn_id}")
async def execute_command(conn_id: str, body: TerminalRequest) -> TerminalCommand:
    command = body.command.strip()
    if not command:
        raise HTTPException(status_code=400, detail="Missing required field: command")

    output, success = await asyncio.to_thread(_execute_sync, conn_id, command)

    return TerminalCommand(
        id=f"cmd-{int(time.time() * 1000)}-{random.getrandbits(24):06x}",
        command=command,
        output=output,
        timestamp=datetime.now(UTC).isoformat(),
        success=success,
    )
