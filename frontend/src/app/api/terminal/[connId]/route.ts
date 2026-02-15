import { NextRequest, NextResponse } from "next/server";
import type { TerminalCommand } from "@/lib/api/types";
import { mockClusters } from "@/lib/mock/data/clusters";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;
  const body = await request.json();
  const command: string = (body.command ?? "").trim();

  if (!command) {
    return NextResponse.json(
      { message: "Missing required field: command" },
      { status: 400 },
    );
  }

  const cluster = mockClusters[connId];
  const namespaces = cluster?.namespaces ?? [];
  const nodes = cluster?.nodes ?? [];

  let output: string;
  let success = true;

  const lowerCmd = command.toLowerCase();

  if (lowerCmd === "show namespaces") {
    if (namespaces.length === 0) {
      output = "(no namespaces)";
    } else {
      const lines = namespaces.map((ns) => `  ${ns.name}`);
      output = `Namespaces:\n${lines.join("\n")}`;
    }
  } else if (lowerCmd === "show sets") {
    const setLines: string[] = [];
    for (const ns of namespaces) {
      for (const s of ns.sets) {
        setLines.push(
          `  ${ns.name}.${s.name}  objects=${s.objects}  tombstones=${s.tombstones}`,
        );
      }
    }
    output =
      setLines.length > 0
        ? `Sets:\n${setLines.join("\n")}`
        : "(no sets)";
  } else if (lowerCmd === "show bins") {
    // Derive bins from namespace/set info -- mock a fixed set of bin names
    const binNames = new Set<string>();
    for (const ns of namespaces) {
      for (const s of ns.sets) {
        if (s.name === "users") {
          ["name", "email", "age", "active", "metadata", "tags"].forEach((b) =>
            binNames.add(b),
          );
        } else if (s.name === "products") {
          ["name", "price", "category", "inStock", "specs"].forEach((b) =>
            binNames.add(b),
          );
        } else if (s.name === "orders") {
          [
            "orderId",
            "userId",
            "total",
            "status",
            "items",
            "address",
            "location",
          ].forEach((b) => binNames.add(b));
        }
      }
    }
    const binList = Array.from(binNames);
    output =
      binList.length > 0
        ? `Bins:\n${binList.map((b) => `  ${b}`).join("\n")}`
        : "(no bins)";
  } else if (lowerCmd === "status") {
    output = "OK";
  } else if (lowerCmd === "build") {
    output = nodes.length > 0 ? `Aerospike CE ${nodes[0].build}` : "Aerospike CE 8.1.0";
  } else if (lowerCmd === "node") {
    output =
      nodes.length > 0
        ? nodes[0].name
        : "BB9060016AE4202";
  } else {
    output = `Unknown command: '${command}'`;
    success = false;
  }

  const result: TerminalCommand = {
    id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    command,
    output,
    timestamp: new Date().toISOString(),
    success,
  };

  return NextResponse.json(result);
}
