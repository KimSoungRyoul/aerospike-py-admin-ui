import * as React from "react"

import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

const variantClasses: Record<string, string> = {
  default:
    "bg-accent/10 text-accent border-accent/20 dark:bg-accent/20 dark:text-accent dark:border-accent/30",
  secondary:
    "bg-secondary text-secondary-foreground border-border",
  destructive:
    "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:border-destructive/30",
  outline:
    "bg-transparent text-foreground border-border",
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
