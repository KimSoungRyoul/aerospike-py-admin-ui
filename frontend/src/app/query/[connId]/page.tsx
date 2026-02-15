"use client";

import { use, useEffect, useState, useMemo, useCallback } from "react";
import { Play, Download, Search, FileJson, FileSpreadsheet, MoreHorizontal } from "lucide-react";
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EmptyState } from "@/components/common/empty-state";
import { InlineAlert } from "@/components/common/inline-alert";
import { LoadingButton } from "@/components/common/loading-button";
import { CodeEditor } from "@/components/common/code-editor";
import { useQueryStore } from "@/stores/query-store";
import { api } from "@/lib/api/client";
import type { AerospikeRecord, BinValue, ClusterInfo, PredicateOperator } from "@/lib/api/types";
import { formatDuration, formatNumber, truncateMiddle } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const OPERATORS: { value: PredicateOperator; label: string }[] = [
  { value: "equals", label: "Equals" },
  { value: "between", label: "Between" },
  { value: "contains", label: "Contains" },
  { value: "geo_within_region", label: "Geo Within Region" },
  { value: "geo_contains_point", label: "Geo Contains Point" },
];

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

  // Predicate local state
  const [predBin, setPredBin] = useState("");
  const [predOp, setPredOp] = useState<PredicateOperator>("equals");
  const [predValue, setPredValue] = useState("");
  const [predValue2, setPredValue2] = useState("");

  // Known bins for multi-select
  const [knownBins, setKnownBins] = useState<string[]>([]);

  useEffect(() => {
    const loadCluster = async () => {
      setLoadingCluster(true);
      try {
        const info = await api.getCluster(connId);
        setClusterInfo(info);
        if (info.namespaces.length > 0 && !store.namespace) {
          store.setNamespace(info.namespaces[0].name);
        }
      } catch {
        // silent
      } finally {
        setLoadingCluster(false);
      }
    };
    loadCluster();

    return () => {
      store.reset();
    };
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

  // Sync predicate to store before executing
  const handleExecute = useCallback(async () => {
    if (!store.namespace) {
      toast.error("Select a namespace");
      return;
    }
    if (store.queryType === "query") {
      if (!predBin.trim()) {
        toast.error("Predicate bin is required for SI Query");
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
        header: "TTL",
        cell: ({ getValue }) => {
          const val = getValue() as number;
          return val === -1 ? "never" : val === 0 ? "default" : `${val}s`;
        },
        size: 70,
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

  const table = useReactTable({
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

  return (
    <div className="flex h-full">
      {/* Left Panel - Query Config */}
      <div className="bg-card/40 w-[380px] shrink-0 overflow-auto border-r">
        <div className="space-y-4 p-4">
          <h2 className="text-lg font-semibold tracking-tight">Query Builder</h2>

          {/* Namespace */}
          <div className="grid gap-2">
            <Label>Namespace</Label>
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
                <SelectTrigger>
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
          <div className="grid gap-2">
            <Label>Set (optional)</Label>
            <Select value={store.set} onValueChange={(v) => store.setSet(v)}>
              <SelectTrigger>
                <SelectValue placeholder="All sets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All sets</SelectItem>
                {sets.map((s) => (
                  <SelectItem key={s.name} value={s.name}>
                    {s.name} ({formatNumber(s.objects)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Query Type Toggle */}
          <div className="grid gap-2">
            <Label>Query Type</Label>
            <div className="flex gap-2">
              <Button
                variant={store.queryType === "scan" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => store.setQueryType("scan")}
              >
                Scan
              </Button>
              <Button
                variant={store.queryType === "query" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => store.setQueryType("query")}
              >
                SI Query
              </Button>
            </div>
          </div>

          {/* Predicate Builder (SI Query) */}
          {store.queryType === "query" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Predicate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2">
                  <Label className="text-xs">Bin Name</Label>
                  <Input
                    placeholder="bin_name"
                    value={predBin}
                    onChange={(e) => setPredBin(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Operator</Label>
                  <Select value={predOp} onValueChange={(v) => setPredOp(v as PredicateOperator)}>
                    <SelectTrigger>
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
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Value</Label>
                  <Input
                    placeholder="value"
                    value={predValue}
                    onChange={(e) => setPredValue(e.target.value)}
                  />
                </div>
                {predOp === "between" && (
                  <div className="grid gap-2">
                    <Label className="text-xs">Value 2</Label>
                    <Input
                      placeholder="upper bound"
                      value={predValue2}
                      onChange={(e) => setPredValue2(e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bin Selection */}
          {knownBins.length > 0 && (
            <div className="grid gap-2">
              <Label>Select Bins (optional)</Label>
              <div className="border-border/60 max-h-[160px] space-y-2 overflow-auto rounded-lg border p-3">
                {knownBins.map((bin) => (
                  <div key={bin} className="flex items-center gap-2">
                    <Checkbox
                      id={`bin-${bin}`}
                      checked={store.selectBins.includes(bin)}
                      onCheckedChange={() => toggleBin(bin)}
                    />
                    <label htmlFor={`bin-${bin}`} className="cursor-pointer font-mono text-sm">
                      {bin}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expression Filter */}
          <Accordion type="single" collapsible>
            <AccordionItem value="expression" className="border-0">
              <AccordionTrigger className="py-2 text-sm">Expression Filter</AccordionTrigger>
              <AccordionContent>
                <div className="h-[150px] overflow-hidden rounded-md border">
                  <CodeEditor
                    value={store.expression}
                    onChange={(v) => store.setExpression(v)}
                    language="json"
                    height="150px"
                  />
                </div>
                <p className="text-muted-foreground mt-1 text-xs">Raw JSON filter expression</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Max Records */}
          <div className="grid gap-2">
            <Label>Max Records</Label>
            <Input
              type="number"
              value={store.maxRecords}
              onChange={(e) => store.setMaxRecords(parseInt(e.target.value, 10) || 100)}
            />
          </div>

          {/* Execute */}
          <LoadingButton
            onClick={handleExecute}
            disabled={store.loading || !store.namespace}
            loading={store.loading}
            className="w-full"
          >
            {!store.loading && <Play className="mr-2 h-4 w-4" />}
            Execute
          </LoadingButton>

          <InlineAlert message={store.error} />
        </div>
      </div>

      {/* Right Panel - Results */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Stats Bar */}
        {store.hasExecuted && (
          <div className="bg-card/60 animate-fade-in flex items-center justify-between border-b px-4 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-4 text-sm">
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
                <Button variant="outline" size="sm" onClick={handleExportJSON}>
                  <FileJson className="mr-1 h-4 w-4" />
                  JSON
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <FileSpreadsheet className="mr-1 h-4 w-4" />
                  CSV
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Results Table */}
        <div className="flex-1 overflow-auto">
          {!store.hasExecuted ? (
            <EmptyState
              icon={Search}
              title="Execute a query"
              description="Configure your query on the left panel and click Execute."
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
              description="The query returned no matching records."
              className="h-full"
            />
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead key={header.id} style={{ width: header.getSize() }}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
