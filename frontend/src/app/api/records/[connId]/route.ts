import { NextRequest, NextResponse } from "next/server";
import type { AerospikeRecord } from "@/lib/api/types";
import { mockRecords as _mockRecords } from "@/lib/mock/data/records";

// Deep clone so mutations don't affect the original module export
const records: Record<string, Record<string, AerospikeRecord[]>> = JSON.parse(
  JSON.stringify(_mockRecords),
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const ns = searchParams.get("ns") ?? "";
  const set = searchParams.get("set") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.max(
    1,
    parseInt(searchParams.get("pageSize") ?? "25", 10),
  );

  const key = `${ns}:${set}`;
  const connRecords = records[connId]?.[key] ?? [];
  const total = connRecords.length;
  const start = (page - 1) * pageSize;
  const paged = connRecords.slice(start, start + pageSize);

  return NextResponse.json({
    records: paged,
    total,
    page,
    pageSize,
    hasMore: start + pageSize < total,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;
  const body = await request.json();

  const { key, bins, ttl } = body;
  if (!key || !key.namespace || !key.set || !key.pk) {
    return NextResponse.json(
      { message: "Missing required key fields: namespace, set, pk" },
      { status: 400 },
    );
  }

  const storeKey = `${key.namespace}:${key.set}`;

  // Ensure nested structures exist
  if (!records[connId]) {
    records[connId] = {};
  }
  if (!records[connId][storeKey]) {
    records[connId][storeKey] = [];
  }

  // Check if record already exists (upsert)
  const existingIdx = records[connId][storeKey].findIndex(
    (r) =>
      r.key.namespace === key.namespace &&
      r.key.set === key.set &&
      r.key.pk === key.pk,
  );

  const record: AerospikeRecord = {
    key: {
      namespace: key.namespace,
      set: key.set,
      pk: key.pk,
      digest:
        key.digest ??
        Math.random().toString(16).slice(2) +
          Math.random().toString(16).slice(2),
    },
    meta: {
      generation:
        existingIdx >= 0
          ? records[connId][storeKey][existingIdx].meta.generation + 1
          : 1,
      ttl: ttl ?? -1,
      lastUpdateMs: Date.now(),
    },
    bins: bins ?? {},
  };

  if (existingIdx >= 0) {
    records[connId][storeKey][existingIdx] = record;
  } else {
    records[connId][storeKey].push(record);
  }

  return NextResponse.json(record, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const ns = searchParams.get("ns") ?? "";
  const set = searchParams.get("set") ?? "";
  const pk = searchParams.get("pk") ?? "";

  if (!ns || !set || !pk) {
    return NextResponse.json(
      { message: "Missing required query params: ns, set, pk" },
      { status: 400 },
    );
  }

  const storeKey = `${ns}:${set}`;
  const connRecords = records[connId]?.[storeKey];

  if (!connRecords) {
    return NextResponse.json(
      { message: "Record not found" },
      { status: 404 },
    );
  }

  const index = connRecords.findIndex(
    (r) =>
      r.key.namespace === ns && r.key.set === set && r.key.pk === pk,
  );

  if (index === -1) {
    return NextResponse.json(
      { message: "Record not found" },
      { status: 404 },
    );
  }

  connRecords.splice(index, 1);

  return NextResponse.json({ message: "Record deleted" });
}
