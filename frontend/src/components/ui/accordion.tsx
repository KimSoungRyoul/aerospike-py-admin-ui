"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface AccordionContextValue {
  type: "single" | "multiple";
  openItems: Set<string>;
  toggle: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue>({
  type: "single",
  openItems: new Set(),
  toggle: () => {},
});

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      type = "single",
      defaultValue,
      value: controlledValue,
      onValueChange,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const [internalOpen, setInternalOpen] = React.useState<Set<string>>(() => {
      if (defaultValue) {
        return new Set(Array.isArray(defaultValue) ? defaultValue : [defaultValue]);
      }
      return new Set();
    });

    const openItems = controlledValue
      ? new Set(Array.isArray(controlledValue) ? controlledValue : [controlledValue])
      : internalOpen;

    const toggle = React.useCallback(
      (value: string) => {
        const next = new Set(openItems);
        if (next.has(value)) {
          next.delete(value);
        } else {
          if (type === "single") next.clear();
          next.add(value);
        }
        setInternalOpen(next);
        if (onValueChange) {
          const arr = Array.from(next);
          onValueChange(type === "single" ? (arr[0] ?? "") : arr);
        }
      },
      [openItems, type, onValueChange],
    );

    return (
      <AccordionContext.Provider value={{ type, openItems, toggle }}>
        <div ref={ref} className={cn(className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  },
);
Accordion.displayName = "Accordion";

const ItemContext = React.createContext<string>("");

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, children, ...props }, ref) => (
    <ItemContext.Provider value={value}>
      <div ref={ref} className={cn("border-b", className)} {...props}>
        {children}
      </div>
    </ItemContext.Provider>
  ),
);
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { openItems, toggle } = React.useContext(AccordionContext);
  const value = React.useContext(ItemContext);
  const isOpen = openItems.has(value);

  return (
    <div className="flex">
      <button
        ref={ref}
        type="button"
        aria-expanded={isOpen}
        className={cn(
          "flex flex-1 items-center justify-between py-4 text-left text-sm font-medium transition-all hover:underline",
          className,
        )}
        onClick={() => toggle(value)}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            "text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
    </div>
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { openItems } = React.useContext(AccordionContext);
    const value = React.useContext(ItemContext);
    const isOpen = openItems.has(value);

    if (!isOpen) return null;

    return (
      <div ref={ref} className="overflow-hidden text-sm" {...props}>
        <div className={cn("pt-0 pb-4", className)}>{children}</div>
      </div>
    );
  },
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
