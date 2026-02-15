"use client";

import { AlertTriangle } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface FullPageErrorProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function FullPageError({
  icon: Icon = AlertTriangle,
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Retry",
}: FullPageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 animate-fade-in">
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-2xl bg-destructive/10 blur-xl scale-150" />
        <div className="relative rounded-2xl bg-muted/80 p-4">
          <Icon className="h-7 w-7 text-destructive" />
        </div>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {message && (
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      )}
      {onRetry && (
        <Button className="mt-5" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
