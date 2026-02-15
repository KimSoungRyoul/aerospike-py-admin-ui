from __future__ import annotations

import random
import time
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from aerospike_ui_api.models.terminal import TerminalCommand, TerminalRequest
from aerospike_ui_api import store

router = APIRouter(prefix="/api/terminal", tags=["terminal"])


@router.post("/{conn_id}")
def execute_command(conn_id: str, body: TerminalRequest) -> TerminalCommand:
    command = body.command.strip()
    if not command:
        raise HTTPException(status_code=400, detail="Missing required field: command")

    cluster = store.clusters.get(conn_id)
    namespaces = cluster.namespaces if cluster else []
    nodes = cluster.nodes if cluster else []

    output: str
    success = True
    lower = command.lower()

    if lower == "show namespaces":
        if not namespaces:
            output = "(no namespaces)"
        else:
            lines = [f"  {ns.name}" for ns in namespaces]
            output = "Namespaces:\n" + "\n".join(lines)

    elif lower == "show sets":
        set_lines: list[str] = []
        for ns in namespaces:
            for s in ns.sets:
                set_lines.append(
                    f"  {ns.name}.{s.name}  objects={s.objects}  tombstones={s.tombstones}"
                )
        output = f"Sets:\n{chr(10).join(set_lines)}" if set_lines else "(no sets)"

    elif lower == "show bins":
        bin_names: set[str] = set()
        for ns in namespaces:
            for s in ns.sets:
                if s.name == "users":
                    bin_names.update(["name", "email", "age", "active", "metadata", "tags"])
                elif s.name == "products":
                    bin_names.update(["name", "price", "category", "inStock", "specs"])
                elif s.name == "orders":
                    bin_names.update(["orderId", "userId", "total", "status", "items", "address", "location"])
        if bin_names:
            output = "Bins:\n" + "\n".join(f"  {b}" for b in sorted(bin_names))
        else:
            output = "(no bins)"

    elif lower == "status":
        output = "OK"

    elif lower == "build":
        output = f"Aerospike CE {nodes[0].build}" if nodes else "Aerospike CE 8.1.0"

    elif lower == "node":
        output = nodes[0].name if nodes else "BB9060016AE4202"

    else:
        output = f"Unknown command: '{command}'"
        success = False

    return TerminalCommand(
        id=f"cmd-{int(time.time() * 1000)}-{random.getrandbits(24):06x}",
        command=command,
        output=output,
        timestamp=datetime.now(timezone.utc).isoformat(),
        success=success,
    )
