"use client";

import { use, useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { JsonViewer } from "@/components/common/json-viewer";
import { CodeEditor } from "@/components/common/code-editor";
import { useBrowserStore } from "@/stores/browser-store";
import { usePagination } from "@/hooks/use-pagination";
import type { AerospikeRecord, BinValue, RecordWriteRequest } from "@/lib/api/types";
import { PAGE_SIZE_OPTIONS, BIN_TYPES, type BinType } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { truncateMiddle, formatNumber } from "@/lib/formatters";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { toast } from "sonner";

/* ─── Types & Helpers ────────────────────────────────── */

interface BinEntry {
  id: string;
  name: string;
  value: string;
  type: BinType;
}

function parseBinValue(value: string, type: BinType): BinValue {
  switch (type) {
    case "integer":
      return parseInt(value, 10) || 0;
    case "float":
      return parseFloat(value) || 0;
    case "bool":
      return value.toLowerCase() === "true";
    case "list":
    case "map":
    case "geojson":
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    case "bytes":
      return value;
    default:
      return value;
  }
}

function detectBinType(value: BinValue): BinType {
  if (value === null || value === undefined) return "string";
  if (typeof value === "boolean") return "bool";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "float";
  if (Array.isArray(value)) return "list";
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("type" in obj && "coordinates" in obj) return "geojson";
    return "map";
  }
  return "string";
}

function serializeBinValue(value: BinValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function renderCellValue(value: BinValue): React.ReactNode {
  if (value === null || value === undefined)
    return <span className="cell-val-null font-mono text-xs">—</span>;

  if (typeof value === "boolean")
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-mono text-xs",
          value ? "text-emerald-500" : "text-red-400/60",
        )}
      >
        <span
          className={cn(
            "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
            value ? "bg-emerald-500" : "bg-red-400/60",
          )}
        />
        {value.toString()}
      </span>
    );

  if (typeof value === "number")
    return <span className="cell-val-number font-mono text-[13px]">{value.toLocaleString()}</span>;

  if (Array.isArray(value))
    return (
      <span className="cell-val-complex font-mono">
        <span className="opacity-40">[</span>
        {value.length} items
        <span className="opacity-40">]</span>
      </span>
    );

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("type" in obj && "coordinates" in obj) {
      return <span className="cell-val-geo font-mono">◉ geo</span>;
    }
    const keyCount = Object.keys(obj).length;
    return (
      <span className="cell-val-complex font-mono">
        <span className="opacity-40">{"{"}</span>
        {keyCount} keys
        <span className="opacity-40">{"}"}</span>
      </span>
    );
  }

  return (
    <span className="text-foreground/85 font-mono text-[13px]">
      {truncateMiddle(String(value), 50)}
    </span>
  );
}

function getVisiblePages(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, 5, "ellipsis", total];
  if (current >= total - 2)
    return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

/* ─── Page Component ─────────────────────────────────── */

export default function BrowserPage({
  params,
}: {
  params: Promise<{ connId: string; ns: string; set: string }>;
}) {
  const { connId, ns, set } = use(params);
  const router = useRouter();

  const {
    records,
    total,
    page,
    pageSize,
    loading,
    error,
    fetchRecords,
    putRecord,
    deleteRecord,
    setPage,
    setPageSize,
  } = useBrowserStore();

  const pagination = usePagination({ total, page, pageSize });

  const [viewRecord, setViewRecord] = useState<AerospikeRecord | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit" | "duplicate">("create");
  const [deleteTarget, setDeleteTarget] = useState<AerospikeRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editor form state
  const [editorPK, setEditorPK] = useState("");
  const [editorTTL, setEditorTTL] = useState("0");
  const [editorBins, setEditorBins] = useState<BinEntry[]>([
    { id: crypto.randomUUID(), name: "", value: "", type: "string" },
  ]);
  const [useCodeEditor, setUseCodeEditor] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchRecords(connId, decodeURIComponent(ns), decodeURIComponent(set));
  }, [connId, ns, set, fetchRecords]);

  const decodedNs = decodeURIComponent(ns);
  const decodedSet = decodeURIComponent(set);

  // Detect dynamic bin columns from records
  const binColumns = useMemo(() => {
    const allBins = new Set<string>();
    records.forEach((r) => {
      Object.keys(r.bins).forEach((b) => allBins.add(b));
    });
    return Array.from(allBins).sort();
  }, [records]);

  const openEditor = useCallback(
    (mode: "create" | "edit" | "duplicate", record?: AerospikeRecord) => {
      setEditorMode(mode);
      if (record && (mode === "edit" || mode === "duplicate")) {
        setEditorPK(mode === "duplicate" ? "" : record.key.pk);
        setEditorTTL(String(record.meta.ttl));
        setEditorBins(
          Object.entries(record.bins).map(([name, value]) => ({
            id: crypto.randomUUID(),
            name,
            value: serializeBinValue(value),
            type: detectBinType(value),
          })),
        );
      } else {
        setEditorPK("");
        setEditorTTL("0");
        setEditorBins([{ id: crypto.randomUUID(), name: "", value: "", type: "string" }]);
      }
      setUseCodeEditor({});
      setEditorOpen(true);
    },
    [],
  );

  const addBin = useCallback(() => {
    setEditorBins((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", value: "", type: "string" },
    ]);
  }, []);

  const removeBin = useCallback((id: string) => {
    setEditorBins((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const updateBin = useCallback((id: string, field: keyof BinEntry, val: string) => {
    setEditorBins((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: val } : b)));
  }, []);

  const handleSaveRecord = async () => {
    if (!editorPK.trim()) {
      toast.error("Primary key is required");
      return;
    }
    setSaving(true);
    try {
      const bins: Record<string, BinValue> = {};
      for (const bin of editorBins) {
        if (bin.name.trim()) {
          bins[bin.name.trim()] = parseBinValue(bin.value, bin.type);
        }
      }
      const data: RecordWriteRequest = {
        key: { namespace: decodedNs, set: decodedSet, pk: editorPK.trim() },
        bins,
        ttl: parseInt(editorTTL, 10) || 0,
      };
      await putRecord(connId, data);
      toast.success(
        editorMode === "create"
          ? "Record created"
          : editorMode === "duplicate"
            ? "Record duplicated"
            : "Record updated",
      );
      setEditorOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRecord(
        connId,
        deleteTarget.key.namespace,
        deleteTarget.key.set,
        deleteTarget.key.pk,
      );
      toast.success("Record deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      fetchRecords(connId, decodedNs, decodedSet, newPage);
    },
    [connId, decodedNs, decodedSet, setPage, fetchRecords],
  );

  const handlePageSizeChange = useCallback(
    (newSize: string) => {
      const size = parseInt(newSize, 10);
      setPageSize(size);
      fetchRecords(connId, decodedNs, decodedSet, 1, size);
    },
    [connId, decodedNs, decodedSet, setPageSize, fetchRecords],
  );

  const padLength = String(pagination.end).length;
  const { isDesktop } = useBreakpoint();

  /* ─── Render ───────────────────────────────────────── */

  return (
    <div className="flex h-full flex-col">
      {/* ── Command Bar ──────────────────────────────── */}
      <div className="border-border/50 bg-card/80 border-b px-3 py-2.5 backdrop-blur-md sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <nav className="flex min-w-0 items-center gap-0.5 font-mono text-[13px]">
              <button
                onClick={() => router.push(`/browser/${connId}`)}
                className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
              >
                browser
              </button>
              <span className="text-muted-foreground/30 mx-1 shrink-0 sm:mx-1.5">›</span>
              <span className="text-muted-foreground max-w-[60px] truncate sm:max-w-none">
                {decodedNs}
              </span>
              <span className="text-muted-foreground/30 mx-1 shrink-0 sm:mx-1.5">›</span>
              <span className="text-accent max-w-[80px] truncate font-medium sm:max-w-none">
                {decodedSet}
              </span>
            </nav>

            {total > 0 && (
              <div className="bg-accent/8 border-accent/15 flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="bg-accent absolute inline-flex h-full w-full animate-ping rounded-full opacity-40" />
                  <span className="bg-accent relative inline-flex h-1.5 w-1.5 rounded-full" />
                </span>
                <span className="text-accent font-mono text-[11px] font-medium tabular-nums">
                  {formatNumber(total)}
                </span>
              </div>
            )}
          </div>

          <Button
            onClick={() => openEditor("create")}
            size="sm"
            variant="outline"
            className="border-accent/30 text-accent hover:bg-accent/10 hover:border-accent/50 h-8 shrink-0 gap-1.5 font-mono text-xs transition-colors sm:h-7"
            data-compact
          >
            <Plus className="h-3 w-3" />
            <span className="hidden sm:inline">new record</span>
          </Button>
        </div>
      </div>

      {/* ── Error ────────────────────────────────────── */}
      {error && (
        <div className="border-destructive/30 bg-destructive/5 text-destructive animate-fade-in mx-6 mt-3 rounded-md border px-4 py-2.5 font-mono text-xs">
          {error}
        </div>
      )}

      {/* ── Data Grid ────────────────────────────────── */}
      <div className="relative flex-1 overflow-auto">
        {/* Loading indicator (page navigation) */}
        {loading && records.length > 0 && (
          <div className="bg-accent/10 sticky top-0 right-0 left-0 z-20 h-[2px] overflow-hidden">
            <div className="loading-bar bg-accent h-full w-1/4 rounded-full" />
          </div>
        )}

        {loading && records.length === 0 ? (
          /* Skeleton loading state */
          <div>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="grid-skeleton-row border-border/20 flex items-center gap-4 border-b px-4 py-3"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex w-10 justify-end">
                  <Skeleton className="h-3 w-6" />
                </div>
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-20 flex-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          /* Empty state */
          <EmptyState
            icon={Database}
            title="No records"
            description={`${decodedNs}.${decodedSet} is empty`}
            action={
              <Button
                onClick={() => openEditor("create")}
                size="sm"
                variant="outline"
                className="border-accent/30 text-accent hover:bg-accent/10 gap-1.5 font-mono text-xs"
              >
                <Plus className="h-3 w-3" />
                new record
              </Button>
            }
          />
        ) : !isDesktop ? (
          /* Mobile card view */
          <div className="space-y-2 p-3">
            {records.map((record, idx) => (
              <div
                key={record.key.pk + idx}
                className="border-border/40 bg-card/60 animate-fade-in rounded-lg border p-3"
                style={{ animationDelay: `${idx * 25}ms` }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-accent font-mono text-sm font-medium">
                    {truncateMiddle(String(record.key.pk), 24)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewRecord(record)}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted/50 inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditor("edit", record)}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted/50 inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(record)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="text-muted-foreground">
                    Gen: <span className="text-foreground font-mono">{record.meta.generation}</span>
                  </span>
                  <span className="text-muted-foreground">
                    TTL:{" "}
                    <span className="text-foreground font-mono">
                      {record.meta.ttl === -1
                        ? "∞"
                        : record.meta.ttl === 0
                          ? "—"
                          : `${record.meta.ttl}s`}
                    </span>
                  </span>
                </div>
                {binColumns.length > 0 && (
                  <div className="border-border/30 mt-2 space-y-1 border-t pt-2">
                    {binColumns.slice(0, 3).map((col) => (
                      <div key={col} className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground/60 w-20 shrink-0 truncate font-mono">
                          {col}
                        </span>
                        <span className="min-w-0 truncate">
                          {renderCellValue(record.bins[col])}
                        </span>
                      </div>
                    ))}
                    {binColumns.length > 3 && (
                      <span className="text-muted-foreground/50 text-[10px]">
                        +{binColumns.length - 3} more bins
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Desktop data table */
          <TooltipProvider delayDuration={300}>
            <Table>
              <TableHeader className="grid-header bg-background/95 sticky top-0 z-10 backdrop-blur-sm">
                <TableRow>
                  <TableHead className="w-14 px-4 py-2.5 text-right">
                    <span className="grid-row-num font-mono">#</span>
                  </TableHead>
                  <TableHead className="px-4 py-2.5 text-left" style={{ width: 180 }}>
                    <span className="text-muted-foreground/60 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase">
                      PK
                    </span>
                  </TableHead>
                  <TableHead className="px-4 py-2.5 text-left" style={{ width: 70 }}>
                    <span className="text-muted-foreground/60 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase">
                      Gen
                    </span>
                  </TableHead>
                  <TableHead className="px-4 py-2.5 text-left" style={{ width: 80 }}>
                    <span className="text-muted-foreground/60 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase">
                      TTL
                    </span>
                  </TableHead>
                  {binColumns.map((col) => (
                    <TableHead
                      key={col}
                      className="px-4 py-2.5 text-left"
                      style={{ minWidth: 140 }}
                    >
                      <span className="text-muted-foreground/60 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase">
                        {col}
                      </span>
                    </TableHead>
                  ))}
                  <TableHead className="w-[130px] px-4 py-2.5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record, idx) => (
                  <TableRow
                    key={record.key.pk + idx}
                    className="record-grid-row border-border/30 group border-b hover:bg-transparent"
                    style={{ animationDelay: `${idx * 25}ms` }}
                  >
                    {/* Row Number */}
                    <TableCell className="w-14 px-4 py-2.5 text-right">
                      <span className="grid-row-num font-mono">
                        {String(pagination.start + idx).padStart(padLength, "0")}
                      </span>
                    </TableCell>

                    {/* PK */}
                    <TableCell className="px-4 py-2.5" style={{ width: 180 }}>
                      <span className="text-foreground font-mono text-[13px] font-medium">
                        {truncateMiddle(String(record.key.pk), 28)}
                      </span>
                    </TableCell>

                    {/* Generation */}
                    <TableCell className="px-4 py-2.5" style={{ width: 70 }}>
                      <span className="text-muted-foreground font-mono text-xs tabular-nums">
                        {record.meta.generation}
                      </span>
                    </TableCell>

                    {/* TTL */}
                    <TableCell className="px-4 py-2.5" style={{ width: 80 }}>
                      <span className="text-muted-foreground/60 font-mono text-xs">
                        {record.meta.ttl === -1
                          ? "∞"
                          : record.meta.ttl === 0
                            ? "—"
                            : `${record.meta.ttl}s`}
                      </span>
                    </TableCell>

                    {/* Bin Values */}
                    {binColumns.map((col) => (
                      <TableCell key={col} className="px-4 py-2.5">
                        {renderCellValue(record.bins[col])}
                      </TableCell>
                    ))}

                    {/* Row Actions (hover reveal) */}
                    <TableCell className="w-[130px] px-4 py-2.5">
                      <div className="row-actions-group flex items-center justify-end gap-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setViewRecord(record)}
                              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <span className="font-mono text-[10px]">View</span>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => openEditor("edit", record)}
                              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <span className="font-mono text-[10px]">Edit</span>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => openEditor("duplicate", record)}
                              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <span className="font-mono text-[10px]">Duplicate</span>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setDeleteTarget(record)}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <span className="font-mono text-[10px]">Delete</span>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TooltipProvider>
        )}
      </div>

      {/* ── Status Bar ───────────────────────────────── */}
      {total > 0 && (
        <div className="border-border/50 bg-card/80 flex flex-col gap-2 border-t px-3 py-2 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {/* Range & page size */}
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
              {pagination.start}–{pagination.end}
              <span className="text-muted-foreground/40 mx-1.5">of</span>
              {formatNumber(total)}
            </span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger
                className="border-border/40 text-muted-foreground h-6 w-[62px] bg-transparent px-2 font-mono text-[11px] [&>svg]:h-3 [&>svg]:w-3"
                data-compact
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)} className="font-mono text-xs">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground/40 hidden text-[10px] tracking-wider uppercase sm:inline">
              per page
            </span>
          </div>

          {/* Page navigation */}
          <div className="flex items-center justify-center gap-0.5">
            {/* First/Last page: hidden on mobile */}
            <button
              className="page-num-btn hidden sm:inline-flex"
              disabled={!pagination.hasPrev || loading}
              onClick={() => handlePageChange(1)}
            >
              <ChevronsLeft className="h-3 w-3" />
            </button>
            <button
              className="page-num-btn"
              disabled={!pagination.hasPrev || loading}
              onClick={() => handlePageChange(page - 1)}
            >
              <ChevronLeft className="h-3 w-3" />
            </button>

            {/* Page numbers: show on sm+, on mobile show current/total */}
            <span className="text-muted-foreground px-2 font-mono text-[11px] sm:hidden">
              {page} / {pagination.totalPages}
            </span>
            <span className="hidden sm:contents">
              {getVisiblePages(page, pagination.totalPages).map((p, i) =>
                p === "ellipsis" ? (
                  <span
                    key={`dots-${i}`}
                    className="text-muted-foreground/30 px-1 font-mono text-[11px] select-none"
                  >
                    ···
                  </span>
                ) : (
                  <button
                    key={p}
                    className={cn("page-num-btn", p === page && "current")}
                    onClick={() => handlePageChange(p as number)}
                    disabled={loading}
                  >
                    {p}
                  </button>
                ),
              )}
            </span>

            <button
              className="page-num-btn"
              disabled={!pagination.hasNext || loading}
              onClick={() => handlePageChange(page + 1)}
            >
              <ChevronRight className="h-3 w-3" />
            </button>
            <button
              className="page-num-btn hidden sm:inline-flex"
              disabled={!pagination.hasNext || loading}
              onClick={() => handlePageChange(pagination.totalPages)}
            >
              <ChevronsRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── View Record Dialog ───────────────────────── */}
      <Dialog open={!!viewRecord} onOpenChange={(open) => !open && setViewRecord(null)}>
        <DialogContent className="border-border/50 max-h-[80vh] gap-0 overflow-hidden p-0 sm:max-w-[620px]">
          <DialogHeader className="border-border/40 space-y-0 border-b px-5 pt-5 pb-3">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-mono text-sm font-medium">Record Detail</DialogTitle>
              <span className="text-accent ml-4 max-w-[250px] truncate font-mono text-[11px]">
                {viewRecord?.key.pk}
              </span>
            </div>
            <DialogDescription className="sr-only">
              Record details for {viewRecord?.key.pk}
            </DialogDescription>
          </DialogHeader>

          {viewRecord && (
            <ScrollArea className="max-h-[calc(80vh-60px)]">
              <div className="space-y-5 p-5">
                {/* Key Section */}
                <section>
                  <h4 className="text-muted-foreground/60 mb-2.5 flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase">
                    Key
                    <span className="bg-border/30 h-px flex-1" />
                  </h4>
                  <div className="grid gap-1.5 font-mono text-[13px]">
                    {(
                      [
                        ["namespace", viewRecord.key.namespace],
                        ["set", viewRecord.key.set],
                        ["pk", viewRecord.key.pk],
                        ...(viewRecord.key.digest ? [["digest", viewRecord.key.digest]] : []),
                      ] as [string, string][]
                    ).map(([label, val]) => (
                      <div key={label} className="flex items-baseline gap-3">
                        <span className="text-muted-foreground/50 w-20 shrink-0 text-[11px]">
                          {label}
                        </span>
                        <span
                          className={cn(
                            label === "pk" && "text-accent",
                            label === "digest" && "text-xs break-all",
                          )}
                        >
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Metadata Section */}
                <section>
                  <h4 className="text-muted-foreground/60 mb-2.5 flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase">
                    Metadata
                    <span className="bg-border/30 h-px flex-1" />
                  </h4>
                  <div className="grid gap-1.5 font-mono text-[13px]">
                    <div className="flex items-baseline gap-3">
                      <span className="text-muted-foreground/50 w-20 shrink-0 text-[11px]">
                        generation
                      </span>
                      <span>{viewRecord.meta.generation}</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-muted-foreground/50 w-20 shrink-0 text-[11px]">
                        ttl
                      </span>
                      <span>
                        {viewRecord.meta.ttl === -1
                          ? "never expires"
                          : viewRecord.meta.ttl === 0
                            ? "default namespace TTL"
                            : `${viewRecord.meta.ttl}s`}
                      </span>
                    </div>
                    {viewRecord.meta.lastUpdateMs && (
                      <div className="flex items-baseline gap-3">
                        <span className="text-muted-foreground/50 w-20 shrink-0 text-[11px]">
                          updated
                        </span>
                        <span className="text-[12px]">
                          {new Date(viewRecord.meta.lastUpdateMs).toISOString()}
                        </span>
                      </div>
                    )}
                  </div>
                </section>

                {/* Bins Section */}
                <section>
                  <h4 className="text-muted-foreground/60 mb-2.5 flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase">
                    Bins
                    <span className="text-muted-foreground/30">
                      ({Object.keys(viewRecord.bins).length})
                    </span>
                    <span className="bg-border/30 h-px flex-1" />
                  </h4>
                  <div className="border-border/40 bg-background/50 max-h-[300px] overflow-auto rounded-md border p-3">
                    <JsonViewer data={viewRecord.bins} />
                  </div>
                </section>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Record Editor Dialog ─────────────────────── */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="border-border/50 flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[700px]">
          <DialogHeader className="border-border/40 space-y-0.5 border-b px-5 pt-5 pb-3">
            <DialogTitle className="font-mono text-sm font-medium">
              {editorMode === "create"
                ? "New Record"
                : editorMode === "duplicate"
                  ? "Duplicate Record"
                  : "Edit Record"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground/60 font-mono text-xs">
              {decodedNs}
              <span className="text-muted-foreground/30 mx-1">.</span>
              {decodedSet}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="space-y-5 p-5">
              {/* Key & TTL */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground/60 font-mono text-[11px] tracking-wider uppercase">
                    Primary Key
                  </Label>
                  <Input
                    placeholder="Record key"
                    value={editorPK}
                    onChange={(e) => setEditorPK(e.target.value)}
                    disabled={editorMode === "edit"}
                    className="border-border/50 focus-visible:ring-accent/30 h-9 font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground/60 font-mono text-[11px] tracking-wider uppercase">
                    TTL (seconds)
                  </Label>
                  <Input
                    type="number"
                    placeholder="0 = default"
                    value={editorTTL}
                    onChange={(e) => setEditorTTL(e.target.value)}
                    className="border-border/50 focus-visible:ring-accent/30 h-9 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Bins */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground/60 font-mono text-[11px] tracking-wider uppercase">
                    Bins
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addBin}
                    className="border-border/40 text-muted-foreground hover:text-accent hover:border-accent/30 h-6 gap-1 font-mono text-[11px]"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </Button>
                </div>

                {editorBins.map((bin) => {
                  const isComplex = ["list", "map", "geojson"].includes(bin.type);
                  const showCode = useCodeEditor[bin.id];
                  const typeAccent: Record<string, string> = {
                    string: "border-l-foreground/15",
                    integer: "border-l-accent/60",
                    float: "border-l-accent/60",
                    bool: "border-l-emerald-500/60",
                    list: "border-l-chart-2/60",
                    map: "border-l-chart-4/60",
                    bytes: "border-l-muted-foreground/30",
                    geojson: "border-l-chart-4/60",
                  };
                  return (
                    <div
                      key={bin.id}
                      className={cn(
                        "border-border/40 hover:border-border/60 space-y-2.5 rounded-md border border-l-2 p-3 transition-colors",
                        typeAccent[bin.type] || "border-l-border",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Bin name"
                          value={bin.name}
                          onChange={(e) => updateBin(bin.id, "name", e.target.value)}
                          className="border-border/40 h-8 flex-1 font-mono text-sm"
                        />
                        <Select
                          value={bin.type}
                          onValueChange={(v) => updateBin(bin.id, "type", v)}
                        >
                          <SelectTrigger className="border-border/40 h-8 w-[110px] font-mono text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BIN_TYPES.map((t) => (
                              <SelectItem key={t} value={t} className="font-mono text-xs">
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {editorBins.length > 1 && (
                          <button
                            type="button"
                            className="text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors"
                            onClick={() => removeBin(bin.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {isComplex && (
                        <button
                          type="button"
                          className="text-muted-foreground/60 hover:text-accent font-mono text-[11px] transition-colors"
                          onClick={() =>
                            setUseCodeEditor((prev) => ({
                              ...prev,
                              [bin.id]: !prev[bin.id],
                            }))
                          }
                        >
                          {showCode ? "↩ simple input" : "⌨ code editor"}
                        </button>
                      )}

                      {isComplex && showCode ? (
                        <div className="border-border/40 h-[200px] overflow-hidden rounded-md border">
                          <CodeEditor
                            value={bin.value}
                            onChange={(v) => updateBin(bin.id, "value", v)}
                            language="json"
                            height="200px"
                          />
                        </div>
                      ) : (
                        <Input
                          placeholder={
                            bin.type === "bool"
                              ? "true / false"
                              : bin.type === "integer" || bin.type === "float"
                                ? "0"
                                : "Value"
                          }
                          value={bin.value}
                          onChange={(e) => updateBin(bin.id, "value", e.target.value)}
                          className="border-border/40 h-8 font-mono text-sm"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>

          <div className="border-border/40 flex items-center justify-end gap-2 border-t px-5 py-3">
            <Button
              variant="ghost"
              onClick={() => setEditorOpen(false)}
              disabled={saving}
              className="h-8 font-mono text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRecord}
              disabled={saving}
              className="h-8 gap-1.5 font-mono text-xs"
            >
              {saving && <Loader2 className="h-3 w-3 animate-spin" />}
              {editorMode === "edit" ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ──────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Record"
        description={`Are you sure you want to delete record with PK "${deleteTarget?.key.pk}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteRecord}
        loading={deleting}
      />
    </div>
  );
}
