"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JsonViewer } from "@/components/common/json-viewer";
import type { AerospikeRecord } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface RecordViewDialogProps {
  record: AerospikeRecord | null;
  onClose: () => void;
}

export function RecordViewDialog({ record, onClose }: RecordViewDialogProps) {
  return (
    <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-border/50 max-h-[80vh] gap-0 overflow-hidden p-0 sm:max-w-[620px]">
        <DialogHeader className="border-border/40 space-y-0 border-b px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-mono text-sm font-medium">Record Detail</DialogTitle>
            <span className="text-accent ml-4 max-w-[250px] truncate font-mono text-[11px]">
              {record?.key.pk}
            </span>
          </div>
          <DialogDescription className="sr-only">
            Record details for {record?.key.pk}
          </DialogDescription>
        </DialogHeader>

        {record && (
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
                      ["namespace", record.key.namespace],
                      ["set", record.key.set],
                      ["pk", record.key.pk],
                      ...(record.key.digest ? [["digest", record.key.digest]] : []),
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
                    <span>{record.meta.generation}</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-muted-foreground/50 w-20 shrink-0 text-[11px]">ttl</span>
                    <span>
                      {record.meta.ttl === -1
                        ? "never expires"
                        : record.meta.ttl === 0
                          ? "default namespace TTL"
                          : `${record.meta.ttl}s`}
                    </span>
                  </div>
                  {record.meta.lastUpdateMs && (
                    <div className="flex items-baseline gap-3">
                      <span className="text-muted-foreground/50 w-20 shrink-0 text-[11px]">
                        updated
                      </span>
                      <span className="text-[12px]">
                        {new Date(record.meta.lastUpdateMs).toISOString()}
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
                    ({Object.keys(record.bins).length})
                  </span>
                  <span className="bg-border/30 h-px flex-1" />
                </h4>
                <div className="border-border/40 bg-background/50 max-h-[300px] overflow-auto rounded-md border p-3">
                  <JsonViewer data={record.bins} />
                </div>
              </section>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
