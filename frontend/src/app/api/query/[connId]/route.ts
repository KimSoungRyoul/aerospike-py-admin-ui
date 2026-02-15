import { NextRequest, NextResponse } from "next/server";
import type {
  AerospikeRecord,
  BinValue,
  QueryRequest,
  QueryResponse,
} from "@/lib/api/types";
import { mockRecords } from "@/lib/mock/data/records";

function matchesPredicate(
  record: AerospikeRecord,
  predicate: QueryRequest["predicate"],
): boolean {
  if (!predicate) return true;

  const binValue = record.bins[predicate.bin];
  if (binValue === undefined) return false;

  switch (predicate.operator) {
    case "equals":
      return binValue === predicate.value;

    case "between": {
      if (
        typeof binValue !== "number" ||
        typeof predicate.value !== "number" ||
        typeof predicate.value2 !== "number"
      ) {
        return false;
      }
      return binValue >= predicate.value && binValue <= predicate.value2;
    }

    case "contains": {
      if (typeof binValue === "string" && typeof predicate.value === "string") {
        return binValue.toLowerCase().includes(predicate.value.toLowerCase());
      }
      if (Array.isArray(binValue)) {
        return binValue.some((item) => item === predicate.value);
      }
      return false;
    }

    case "geo_within_region":
    case "geo_contains_point":
      // For mock purposes, return all records with a GeoJSON bin
      return (
        binValue !== null &&
        typeof binValue === "object" &&
        !Array.isArray(binValue) &&
        "type" in (binValue as Record<string, BinValue>) &&
        "coordinates" in (binValue as Record<string, BinValue>)
      );

    default:
      return true;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;
  const body: QueryRequest = await request.json();

  const { namespace, set, predicate, selectBins, maxRecords, type } = body;

  // Gather all records for this connection in the target namespace
  const connRecords = mockRecords[connId];
  if (!connRecords) {
    return NextResponse.json(
      { message: `No data for connection '${connId}'` },
      { status: 404 },
    );
  }

  // Collect matching record sets
  let allRecords: AerospikeRecord[] = [];
  for (const [key, recs] of Object.entries(connRecords)) {
    const [recNs, recSet] = key.split(":");
    if (recNs !== namespace) continue;
    if (set && recSet !== set) continue;
    allRecords = allRecords.concat(recs);
  }

  const scannedRecords = allRecords.length;

  // Apply predicate filter for queries (not scans without predicates)
  let filtered: AerospikeRecord[];
  if (type === "query" && predicate) {
    filtered = allRecords.filter((r) => matchesPredicate(r, predicate));
  } else {
    filtered = allRecords;
  }

  // Apply maxRecords limit
  if (maxRecords && maxRecords > 0) {
    filtered = filtered.slice(0, maxRecords);
  }

  // Select specific bins if requested
  if (selectBins && selectBins.length > 0) {
    filtered = filtered.map((record) => ({
      ...record,
      bins: Object.fromEntries(
        Object.entries(record.bins).filter(([binName]) =>
          selectBins.includes(binName),
        ),
      ),
    }));
  }

  const executionTimeMs = Math.round(5 + Math.random() * 45);

  const response: QueryResponse = {
    records: filtered,
    executionTimeMs,
    scannedRecords,
    returnedRecords: filtered.length,
  };

  return NextResponse.json(response);
}
