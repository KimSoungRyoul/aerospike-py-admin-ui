"use client";

import { use, useEffect, useState, useMemo, useCallback } from "react";
import {
  Play,
  Search,
  FileJson,
  FileSpreadsheet,
  SlidersHorizontal,
  ChevronDown,
  Key,
  ScanSearch,
  Filter,
} from "lucide-react";
import { useReactTable, getCoreRowModel, type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { InlineAlert } from "@/components/common/inline-alert";
import { LoadingButton } from "@/components/common/loading-button";
import { CodeEditor } from "@/components/common/code-editor";
import { DataTable } from "@/components/common/data-table";
import { useQueryStore } from "@/stores/query-store";
import { api } from "@/lib/api/client";
import type { AerospikeRecord, BinValue, ClusterInfo, PredicateOperator } from "@/lib/api/types";
import { formatDuration, formatNumber, formatTTLAsExpiry, truncateMiddle } from "@/lib/formatters";
import { cn, getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";

const OPERATORS: { value: PredicateOperator; label: string }[] = [
  { value: "equals", label: "Equals (=)" },
  { value: "between", label: "Between" },
  { value: "contains", label: "Contains" },
  { value: "geo_within_region", label: "Geo Within Region" },
  { value: "geo_contains_point", label: "Geo Contains Point" },
];

const QUERY_MODE_OPTIONS = [
  { value: "scan", label: "Scan All", icon: ScanSearch, description: "Full scan of namespace/set" },
  { value: "pk", label: "PK Lookup", icon: Key, description: "Find record by primary key" },
  {
    value: "query",
    label: "Index Query",
    icon: Filter,
    description: "Query with secondary index predicate",
  },
] as const;

function renderCellValue(value: BinValue): React.ReactNode {
  if (value === null || value === undefined)
    return <span className="text-muted-foreground italic">null</span>;
  if (typeof value === "boolean")
    return (
      <Badge variant="outline" className="font-mono text-xs">
        {value.toString()}
      </Badge>
    );
  if (typeof value === "object")
    return (
      <span className="text-muted-foreground font-mono text-xs">
        {JSON.stringify(value).slice(0, 50)}...
      </span>
    );
  return <span className="font-mono text-sm">{truncateMiddle(String(value), 40)}</span>;
}

export default function QueryPage({ params }: { params: Promise<{ connId: string }> }) {
  const { connId } = use(params);
  const store = useQueryStore();

  const [clusterInfo, setClusterInfo] = useState<ClusterInfo | null>(null);
  const [loadingCluster, setLoadingCluster] = useState(true);
  const [clusterError, setClusterError] = useState<string | null>(null);

  // Predicate local state
  const [predBin, setPredBin] = useState("");
  const [predOp, setPredOp] = useState<PredicateOperator>("equals");
  const [predValue, setPredValue] = useState("");
  const [predValue2, setPredValue2] = useState("");

  // Known bins for multi-select
  const [knownBins, setKnownBins] = useState<string[]>([]);

  // Advanced panel toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const loadCluster = async () => {
      setLoadingCluster(true);
      try {
        const info = await api.getCluster(connId);
        setClusterInfo(info);
        setClusterError(null);
        if (info.namespaces.length > 0 && !store.namespace) {
          store.setNamespace(info.namespaces[0].name);
        }
      } catch (err) {
        setClusterError(getErrorMessage(err));
      } finally {
        setLoadingCluster(false);
      }
    };
    loadCluster();

    return () => {
      store.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/connId-change only
  }, [connId]);

  // Collect known bin names from results
  useEffect(() => {
    if (store.results.length > 0) {
      const bins = new Set<string>();
      store.results.forEach((r) => Object.keys(r.bins).forEach((b) => bins.add(b)));
      setKnownBins(Array.from(bins).sort());
    }
  }, [store.results]);

  const namespaces = clusterInfo?.namespaces ?? [];
  const selectedNs = namespaces.find((n) => n.name === store.namespace);
  const sets = selectedNs?.sets ?? [];

  const handleExecute = useCallback(async () => {
    if (!store.namespace) {
      toast.error("Select a namespace");
      return;
    }
    if (store.queryType === "pk") {
      if (!store.set || !store.set.trim()) {
        toast.error("Set is required for PK Lookup");
        return;
      }
      if (!store.primaryKey.trim()) {
        toast.error("Primary key is required for PK Lookup");
        return;
      }
      store.setPredicate(null);
    } else if (store.queryType === "query") {
      if (!predBin.trim()) {
        toast.error("Predicate bin is required for Index Query");
        return;
      }
      store.setPredicate({
        bin: predBin.trim(),
        operator: predOp,
        value: predValue,
        value2: predOp === "between" ? predValue2 : undefined,
      });
    } else {
      store.setPredicate(null);
    }
    await store.executeQuery(connId);
  }, [connId, store, predBin, predOp, predValue, predValue2]);

  // Result columns
  const resultColumns = useMemo<ColumnDef<AerospikeRecord>[]>(() => {
    if (store.results.length === 0) return [];

    const binNames = new Set<string>();
    store.results.forEach((r) => Object.keys(r.bins).forEach((b) => binNames.add(b)));

    const cols: ColumnDef<AerospikeRecord>[] = [
      {
        accessorFn: (row) => row.key.pk,
        id: "pk",
        header: "PK",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm font-medium">
            {truncateMiddle(String(getValue()), 24)}
          </span>
        ),
        size: 160,
      },
      {
        accessorFn: (row) => row.meta.generation,
        id: "generation",
        header: "Gen",
        size: 60,
      },
      {
        accessorFn: (row) => row.meta.ttl,
        id: "ttl",
        header: "Expiry",
        cell: ({ getValue }) => {
          const val = getValue() as number;
          return <span title={`TTL: ${val}s`}>{formatTTLAsExpiry(val)}</span>;
        },
        size: 170,
      },
    ];

    Array.from(binNames)
      .sort()
      .forEach((binName) => {
        cols.push({
          accessorFn: (row) => row.bins[binName],
          id: `bin_${binName}`,
          header: binName,
          cell: ({ getValue }) => renderCellValue(getValue() as BinValue),
          size: 180,
        });
      });

    return cols;
  }, [store.results]);

  useReactTable({
    data: store.results,
    columns: resultColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleExportJSON = useCallback(() => {
    const data = store.results.map((r) => ({
      key: r.key,
      meta: r.meta,
      bins: r.bins,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as JSON");
  }, [store.results]);

  const handleExportCSV = useCallback(() => {
    if (store.results.length === 0) return;
    const binNames = new Set<string>();
    store.results.forEach((r) => Object.keys(r.bins).forEach((b) => binNames.add(b)));
    const headers = ["pk", "generation", "ttl", ...Array.from(binNames)];
    const rows = store.results.map((r) => [
      r.key.pk,
      r.meta.generation,
      r.meta.ttl,
      ...Array.from(binNames).map((b) => {
        const val = r.bins[b];
        if (val === null || val === undefined) return "";
        if (typeof val === "object") return JSON.stringify(val);
        return String(val);
      }),
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as CSV");
  }, [store.results]);

  const toggleBin = useCallback(
    (bin: string) => {
      const current = store.selectBins;
      if (current.includes(bin)) {
        store.setSelectBins(current.filter((b) => b !== bin));
      } else {
        store.setSelectBins([...current, bin]);
      }
    },
    [store],
  );

  const currentMode = QUERY_MODE_OPTIONS.find((m) => m.value === store.queryType)!;
  const ModeIcon = currentMode.icon;

  return (
    <div className="flex h-full flex-col">
      {/* ── Filter Bar ──────────────────────────────────── */}
      <div className="border-border/50 bg-card/80 shrink-0 border-b backdrop-blur-md">
        <div className="space-y-3 p-4 sm:p-5">
          {/* Row 1: Namespace / Set / Query Mode / Execute */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            {/* Namespace */}
            <div className="grid min-w-0 gap-1.5 sm:w-[180px]">
              <Label className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                Namespace
              </Label>
              {loadingCluster ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Select
                  value={store.namespace}
                  onValueChange={(v) => {
                    store.setNamespace(v);
                    store.setSet("");
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select namespace" />
                  </SelectTrigger>
                  <SelectContent>
                    {namespaces.map((ns) => (
                      <SelectItem key={ns.name} value={ns.name}>
                        {ns.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Set */}
            <div className="grid min-w-0 gap-1.5 sm:w-[180px]">
              <Label className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                Set{store.queryType === "pk" ? " (required)" : ""}
              </Label>
              <Select value={store.set} onValueChange={(v) => store.setSet(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All sets" />
                </SelectTrigger>
                <SelectContent>
                  {store.queryType !== "pk" && <SelectItem value=" ">All sets</SelectItem>}
                  {sets.map((s) => (
                    <SelectItem key={s.name} value={s.name}>
                      {s.name} ({formatNumber(s.objects)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Separator */}
            <div className="bg-border hidden h-9 w-px sm:block" />

            {/* Query Mode */}
            <div className="grid min-w-0 gap-1.5 sm:w-[170px]">
              <Label className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                Mode
              </Label>
              <Select
                value={store.queryType}
                onValueChange={(v) => store.setQueryType(v as "scan" | "query" | "pk")}
              >
                <SelectTrigger className="h-9">
                  <div className="flex items-center gap-2">
                    <ModeIcon className="h-3.5 w-3.5 shrink-0" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {QUERY_MODE_OPTIONS.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      <div className="flex items-center gap-2">
                        <mode.icon className="text-muted-foreground h-3.5 w-3.5" />
                        <span>{mode.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Spacer on desktop */}
            <div className="hidden flex-1 sm:block" />

            {/* Execute */}
            <LoadingButton
              onClick={handleExecute}
              disabled={store.loading || !store.namespace}
              loading={store.loading}
              className="h-9 gap-2 sm:w-auto"
              size="sm"
            >
              {!store.loading && <Play className="h-3.5 w-3.5" />}
              Execute
            </LoadingButton>
          </div>

          {clusterError && <InlineAlert message={`Failed to load namespaces: ${clusterError}`} />}

          {/* Row 2: Contextual inputs based on query mode */}
          {store.queryType === "pk" && (
            <div className="animate-fade-in flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="grid min-w-0 flex-1 gap-1.5">
                <Label className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                  Primary Key
                </Label>
                <div className="relative">
                  <Key className="text-muted-foreground/50 absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
                  <Input
                    placeholder="Enter primary key value"
                    value={store.primaryKey}
                    onChange={(e) => store.setPrimaryKey(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleExecute()}
                    className="h-9 pl-9"
                  />
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Integer keys are auto-detected (e.g. &quot;123&quot; → int)
                </p>
              </div>
            </div>
          )}

          {store.queryType === "query" && (
            <div className="animate-fade-in">
              <Label className="text-muted-foreground mb-2 block text-[11px] font-medium tracking-wider uppercase">
                Predicate Filter
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="text-muted-foreground hidden text-xs font-medium sm:inline">
                  WHERE
                </span>
                <Input
                  placeholder="bin_name"
                  value={predBin}
                  onChange={(e) => setPredBin(e.target.value)}
                  className="h-9 font-mono sm:w-[160px]"
                />
                <Select value={predOp} onValueChange={(v) => setPredOp(v as PredicateOperator)}>
                  <SelectTrigger className="h-9 sm:w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="value"
                  value={predValue}
                  onChange={(e) => setPredValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleExecute()}
                  className="h-9 font-mono sm:w-[160px]"
                />
                {predOp === "between" && (
                  <>
                    <span className="text-muted-foreground hidden text-xs font-medium sm:inline">
                      AND
                    </span>
                    <Input
                      placeholder="upper bound"
                      value={predValue2}
                      onChange={(e) => setPredValue2(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleExecute()}
                      className="h-9 font-mono sm:w-[160px]"
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Advanced toggle */}
          {store.queryType !== "pk" && (
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-medium transition-colors"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Advanced Options
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    showAdvanced && "rotate-180",
                  )}
                />
              </button>

              {showAdvanced && (
                <div className="animate-fade-in mt-3 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    {/* Max Records */}
                    <div className="grid gap-1.5 sm:w-[140px]">
                      <Label className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                        Max Records
                      </Label>
                      <Input
                        type="number"
                        value={store.maxRecords}
                        onChange={(e) => store.setMaxRecords(parseInt(e.target.value, 10) || 100)}
                        className="h-9"
                      />
                    </div>

                    {/* Bin Selection */}
                    {knownBins.length > 0 && (
                      <div className="grid min-w-0 gap-1.5">
                        <Label className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                          Select Bins
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                          {knownBins.map((bin) => (
                            <button
                              key={bin}
                              onClick={() => toggleBin(bin)}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors",
                                store.selectBins.includes(bin)
                                  ? "border-accent/50 bg-accent/10 text-accent"
                                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
                              )}
                            >
                              <Checkbox
                                checked={store.selectBins.includes(bin)}
                                onCheckedChange={() => toggleBin(bin)}
                                className="h-3 w-3"
                              />
                              {bin}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expression Filter */}
                  <div className="grid gap-1.5">
                    <Label className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                      Expression Filter
                    </Label>
                    <div className="h-[120px] overflow-hidden rounded-md border">
                      <CodeEditor
                        value={store.expression}
                        onChange={(v) => store.setExpression(v)}
                        language="json"
                        height="120px"
                      />
                    </div>
                    <p className="text-muted-foreground text-[11px]">Raw JSON filter expression</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Bar ──────────────────────────────────── */}
      {store.hasExecuted && (
        <div className="bg-card/60 animate-fade-in flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-2 backdrop-blur-sm sm:px-5">
          <div className="flex flex-wrap items-center gap-3 text-sm sm:gap-4">
            <span>
              <span className="text-muted-foreground text-xs tracking-wider uppercase">Time</span>{" "}
              <span className="metric-value font-mono font-medium">
                {formatDuration(store.executionTimeMs)}
              </span>
            </span>
            <span>
              <span className="text-muted-foreground text-xs tracking-wider uppercase">
                Scanned
              </span>{" "}
              <span className="metric-value font-mono font-medium">
                {formatNumber(store.scannedRecords)}
              </span>
            </span>
            <span>
              <span className="text-muted-foreground text-xs tracking-wider uppercase">
                Returned
              </span>{" "}
              <span className="metric-value font-mono font-medium">
                {formatNumber(store.returnedRecords)}
              </span>
            </span>
          </div>
          {store.results.length > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportJSON} data-compact>
                <FileJson className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">JSON</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} data-compact>
                <FileSpreadsheet className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Error ─────────────────────────────────────── */}
      <InlineAlert message={store.error} className="mx-4 mt-3 sm:mx-5" />

      {/* ── Results ───────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {!store.hasExecuted ? (
          <EmptyState
            icon={Search}
            title="Execute a query"
            description="Configure your filters above and click Execute to search records."
            className="h-full"
          />
        ) : store.loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : store.results.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No results"
            description="The query returned no matching records. Try adjusting your filters."
            className="h-full"
          />
        ) : (
          <DataTable
            data={store.results}
            columns={resultColumns}
            loading={store.loading}
            testId="query-results-table"
          />
        )}
      </div>
    </div>
  );
}
