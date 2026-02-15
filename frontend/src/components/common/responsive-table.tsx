"use client";

import React from "react";
import { useBreakpoint } from "@/hooks/use-breakpoint";

interface ResponsiveTableProps<T> {
  data: T[];
  renderTable: () => React.ReactNode;
  renderCard: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export function ResponsiveTable<T>({
  data,
  renderTable,
  renderCard,
  className,
}: ResponsiveTableProps<T>) {
  const { isDesktop } = useBreakpoint();

  if (isDesktop) {
    return <div className={className}>{renderTable()}</div>;
  }

  return (
    <div className={className}>
      {data.map((item, index) => (
        <React.Fragment key={index}>{renderCard(item, index)}</React.Fragment>
      ))}
    </div>
  );
}
