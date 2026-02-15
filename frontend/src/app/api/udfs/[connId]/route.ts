import { NextRequest, NextResponse } from "next/server";
import type { UDFModule } from "@/lib/api/types";
import { mockUDFs as _mockUDFs } from "@/lib/mock/data/udfs";

// Deep clone so mutations don't affect the original module export
const udfs: Record<string, UDFModule[]> = JSON.parse(
  JSON.stringify(_mockUDFs),
);

function mockHash(input: string): string {
  const base = "abcdef0123456789";
  let hash = "";
  let seed = 0;
  for (let i = 0; i < input.length; i++) {
    seed = (seed * 31 + input.charCodeAt(i)) & 0x7fffffff;
  }
  for (let i = 0; i < 64; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    hash += base[seed % 16];
  }
  return hash;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;

  return NextResponse.json(udfs[connId] ?? []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;
  const body = await request.json();

  const { filename, content, type } = body;
  if (!filename || !content) {
    return NextResponse.json(
      { message: "Missing required fields: filename, content" },
      { status: 400 },
    );
  }

  if (!udfs[connId]) {
    udfs[connId] = [];
  }

  // Check for existing UDF with the same filename (update it)
  const existingIdx = udfs[connId].findIndex(
    (u) => u.filename === filename,
  );

  const udfModule: UDFModule = {
    filename,
    type: type ?? "LUA",
    hash: mockHash(content),
    content,
  };

  if (existingIdx >= 0) {
    udfs[connId][existingIdx] = udfModule;
  } else {
    udfs[connId].push(udfModule);
  }

  return NextResponse.json(udfModule, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const filename = searchParams.get("filename") ?? "";

  if (!filename) {
    return NextResponse.json(
      { message: "Missing required query param: filename" },
      { status: 400 },
    );
  }

  const connUdfs = udfs[connId];
  if (!connUdfs) {
    return NextResponse.json(
      { message: "UDF not found" },
      { status: 404 },
    );
  }

  const index = connUdfs.findIndex((u) => u.filename === filename);

  if (index === -1) {
    return NextResponse.json(
      { message: "UDF not found" },
      { status: 404 },
    );
  }

  connUdfs.splice(index, 1);

  return NextResponse.json({ message: "UDF deleted" });
}
