"use client";

import { AlertTriangle } from "lucide-react";
import { CE_LIMITS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CELimitBannerProps {
  type: "namespaces" | "nodes" | "data" | "durable-delete" | "xdr";
  className?: string;
}

const messages: Record<CELimitBannerProps["type"], string> = {
  namespaces: `Community Edition: Maximum ${CE_LIMITS.MAX_NAMESPACES} namespaces`,
  nodes: `Community Edition: Maximum ${CE_LIMITS.MAX_NODES} nodes per cluster`,
  data: `Community Edition: Maximum ~${CE_LIMITS.MAX_DATA_TB}TB data`,
  "durable-delete":
    "Community Edition: Durable Delete not supported. Records may reappear after cold restart.",
  xdr: "Community Edition: Cross Datacenter Replication (XDR) not available",
};

export function CELimitBanner({ type, className }: CELimitBannerProps) {
  return (
    <div
      className={cn(
        "border-warning/20 bg-warning/5 text-warning flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
        className,
      )}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>{messages[type]}</span>
    </div>
  );
}
