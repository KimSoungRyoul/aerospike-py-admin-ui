import { cn } from "@/lib/utils";

type AlertVariant = "error" | "warning" | "info";

interface InlineAlertProps {
  message: string | null | undefined;
  variant?: AlertVariant;
  className?: string;
}

const variantStyles: Record<AlertVariant, string> = {
  error: "border-destructive/30 bg-destructive/5 text-destructive",
  warning: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400",
  info: "border-accent/30 bg-accent/5 text-accent",
};

export function InlineAlert({ message, variant = "error", className }: InlineAlertProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "animate-fade-in rounded-lg border p-3 text-sm",
        variantStyles[variant],
        className,
      )}
    >
      {message}
    </div>
  );
}
