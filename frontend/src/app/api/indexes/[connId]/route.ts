import { NextRequest, NextResponse } from "next/server";
import type { SecondaryIndex } from "@/lib/api/types";
import { mockIndexes as _mockIndexes } from "@/lib/mock/data/indexes";

// Deep clone so mutations don't affect the original module export
const indexes: Record<string, SecondaryIndex[]> = JSON.parse(
  JSON.stringify(_mockIndexes),
);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;

  return NextResponse.json(indexes[connId] ?? []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;
  const body = await request.json();

  const { namespace, set, bin, name, type } = body;
  if (!namespace || !set || !bin || !name || !type) {
    return NextResponse.json(
      { message: "Missing required fields: namespace, set, bin, name, type" },
      { status: 400 },
    );
  }

  if (!indexes[connId]) {
    indexes[connId] = [];
  }

  // Check for duplicate
  const existing = indexes[connId].find((idx) => idx.name === name);
  if (existing) {
    return NextResponse.json(
      { message: `Index '${name}' already exists` },
      { status: 409 },
    );
  }

  const newIndex: SecondaryIndex = {
    name,
    namespace,
    set,
    bin,
    type,
    state: "ready",
  };

  indexes[connId].push(newIndex);

  return NextResponse.json(newIndex, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name") ?? "";
  const ns = searchParams.get("ns") ?? "";

  if (!name || !ns) {
    return NextResponse.json(
      { message: "Missing required query params: name, ns" },
      { status: 400 },
    );
  }

  const connIndexes = indexes[connId];
  if (!connIndexes) {
    return NextResponse.json(
      { message: "Index not found" },
      { status: 404 },
    );
  }

  const index = connIndexes.findIndex(
    (idx) => idx.name === name && idx.namespace === ns,
  );

  if (index === -1) {
    return NextResponse.json(
      { message: "Index not found" },
      { status: 404 },
    );
  }

  connIndexes.splice(index, 1);

  return NextResponse.json({ message: "Index deleted" });
}
