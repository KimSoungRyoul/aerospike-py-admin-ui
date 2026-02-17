"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnPinningState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  RowSelectionState,
  OnChangeFn,
  Row,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";

interface DataTableProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  loading?: boolean;
  emptyState?: React.ReactNode;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  onRowClick?: (row: Row<TData>) => void;
  enableColumnPinning?: boolean;
  columnPinning?: ColumnPinningState;
  getRowId?: (row: TData) => string;
  tableMinWidth?: number;
  className?: string;
  testId?: string;
}

export function DataTable<TData, TValue>({
  data,
  columns,
  loading = false,
  emptyState,
  rowSelection,
  onRowSelectionChange,
  onRowClick,
  enableColumnPinning = false,
  columnPinning,
  getRowId,
  tableMinWidth,
  className,
  testId = "data-table",
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection: rowSelection || {},
      ...(enableColumnPinning && columnPinning ? { columnPinning } : {}),
    },
    enableRowSelection: true,
    enableColumnPinning,
    onRowSelectionChange: onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    ...(getRowId ? { getRowId } : {}),
  });

  return (
    <div className={cn("relative flex-1 overflow-auto", className)} data-testid={testId}>
      {loading && data.length > 0 && (
        <div className="bg-accent/10 sticky top-0 right-0 left-0 z-20 h-[2px] overflow-hidden">
          <div className="loading-bar bg-accent h-full w-1/4 rounded-full" />
        </div>
      )}

      {loading && data.length === 0 ? (
        <div data-testid={`${testId}-skeleton`}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="grid-skeleton-row border-border/20 flex items-center gap-4 border-b px-4 py-3"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <Skeleton className="h-3.5 w-full" />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        emptyState || <EmptyState title="No records" description="No data available to display" />
      ) : (
        <table
          className={cn("table-pin-rows table table-fixed", !tableMinWidth && "w-full")}
          style={tableMinWidth ? { minWidth: tableMinWidth } : undefined}
        >
          <thead className="grid-header" data-testid={`${testId}-head`}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const pinned = header.column.getIsPinned();
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "bg-base-100 px-4 py-2.5 text-left",
                        (header.column.columnDef.meta as Record<string, unknown>)?.className as
                          | string
                          | undefined,
                      )}
                      style={{
                        width: header.getSize() !== 150 ? header.getSize() : undefined,
                        ...(pinned === "left"
                          ? {
                              position: "sticky" as const,
                              left: header.column.getStart("left"),
                              zIndex: 30,
                            }
                          : {}),
                        ...(pinned === "right"
                          ? {
                              position: "sticky" as const,
                              right: header.column.getAfter("right"),
                              zIndex: 30,
                            }
                          : {}),
                        ...((header.column.columnDef.meta as Record<string, unknown>)?.style as
                          | React.CSSProperties
                          | undefined),
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody data-testid={`${testId}-body`}>
            {table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                className={cn(
                  "record-grid-row border-border/30 group border-b hover:bg-transparent",
                  onRowClick && "cursor-pointer",
                )}
                style={{ animationDelay: `${idx * 25}ms` }}
                onClick={() => onRowClick?.(row)}
                data-testid={`${testId}-row-${idx}`}
              >
                {row.getVisibleCells().map((cell) => {
                  const pinned = cell.column.getIsPinned();
                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        "px-4 py-2.5",
                        pinned && "bg-base-100",
                        (cell.column.columnDef.meta as Record<string, unknown>)?.className as
                          | string
                          | undefined,
                      )}
                      style={{
                        ...(pinned === "left"
                          ? {
                              position: "sticky" as const,
                              left: cell.column.getStart("left"),
                              zIndex: 10,
                            }
                          : {}),
                        ...(pinned === "right"
                          ? {
                              position: "sticky" as const,
                              right: cell.column.getAfter("right"),
                              zIndex: 10,
                            }
                          : {}),
                        ...((cell.column.columnDef.meta as Record<string, unknown>)?.style as
                          | React.CSSProperties
                          | undefined),
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
