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
        "flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-200",
        className,
      )}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>{messages[type]}</span>
    </div>
  );
}
