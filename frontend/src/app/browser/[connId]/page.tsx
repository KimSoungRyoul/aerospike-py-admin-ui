"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Database,
  RefreshCw,
  Table2,
  ChevronRight,
  ChevronDown,
  HardDrive,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { InlineAlert } from "@/components/common/inline-alert";
import { useAsyncData } from "@/hooks/use-async-data";
import { api } from "@/lib/api/client";
import type { ClusterInfo, NamespaceInfo, SetInfo } from "@/lib/api/types";
import { formatNumber, formatBytes } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const SetCard = React.memo(function SetCard({
  set,
  connId,
  ns,
}: {
  set: SetInfo;
  connId: string;
  ns: string;
}) {
  const router = useRouter();

  return (
    <button
      onClick={() =>
        router.push(
          `/browser/${connId}/${encodeURIComponent(ns)}/${encodeURIComponent(set.name)}`
        )
      }
      className="group flex items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-3 text-left transition-all duration-150 hover:border-accent/40 hover:bg-accent/5 hover:shadow-sm card-interactive"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent transition-colors group-hover:bg-accent/15">
        <Table2 className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono font-medium text-sm truncate">
          {set.name}
        </p>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatNumber(set.objects)} records</span>
          {set.memoryDataBytes > 0 && (
            <span>{formatBytes(set.memoryDataBytes)}</span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
    </button>
  );
});

const NamespaceSection = React.memo(function NamespaceSection({
  namespace,
  connId,
  defaultExpanded,
}: {
  namespace: NamespaceInfo;
  connId: string;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const memoryPct =
    namespace.memoryTotal > 0
      ? Math.round((namespace.memoryUsed / namespace.memoryTotal) * 100)
      : 0;

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => setExpanded(!expanded)}
        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground/60 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
        )}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Database className="h-4 w-4" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <span className="font-semibold text-sm">{namespace.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            {namespace.sets.length} sets
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            {formatNumber(namespace.objects)} obj
          </Badge>
          {memoryPct > 0 && (
            <Badge
              variant={memoryPct > 80 ? "destructive" : "outline"}
              className="font-mono text-xs"
            >
              {memoryPct}% mem
            </Badge>
          )}
        </div>
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-out",
          expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="grid gap-2 pl-10 pr-2 pb-3">
          {namespace.sets.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No sets in this namespace
            </p>
          ) : (
            namespace.sets.map((set) => (
              <SetCard
                key={set.name}
                set={set}
                connId={connId}
                ns={namespace.name}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
});

export default function BrowserSetListPage({
  params,
}: {
  params: Promise<{ connId: string }>;
}) {
  const { connId } = use(params);
  const {
    data: clusterInfo,
    loading,
    error,
    refetch: fetchData,
  } = useAsyncData(() => api.getCluster(connId), [connId]);

  const namespaces = clusterInfo?.namespaces ?? [];
  const totalSets = namespaces.reduce((sum, ns) => sum + ns.sets.length, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <PageHeader
        title="Data Browser"
        description="Select a namespace and set to browse records"
        actions={
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {/* Stats */}
      {!loading && clusterInfo && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Layers className="h-4 w-4" />
            <span>
              <span className="font-semibold text-foreground">
                {namespaces.length}
              </span>{" "}
              namespaces
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <HardDrive className="h-4 w-4" />
            <span>
              <span className="font-semibold text-foreground">
                {totalSets}
              </span>{" "}
              sets
            </span>
          </div>
        </div>
      )}

      <InlineAlert message={error} />

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <div className="pl-10 space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : namespaces.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No namespaces"
          description="No namespaces found in this cluster."
        />
      ) : (
        <div className="space-y-1">
          {namespaces.map((ns, i) => (
            <NamespaceSection
              key={ns.name}
              namespace={ns}
              connId={connId}
              defaultExpanded={i === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
