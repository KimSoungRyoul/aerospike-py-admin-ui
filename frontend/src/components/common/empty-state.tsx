"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center animate-fade-in", className)}>
      {Icon && (
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-2xl bg-accent/10 blur-xl scale-150" />
          <div className="relative rounded-2xl bg-muted/80 p-4 dark:bg-muted/50">
            <Icon className="h-7 w-7 text-muted-foreground" />
          </div>
        </div>
      )}
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
