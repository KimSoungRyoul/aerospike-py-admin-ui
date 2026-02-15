"use client";

import { useMemo } from "react";

interface UsePaginationProps {
  total: number;
  page: number;
  pageSize: number;
}

export function usePagination({ total, page, pageSize }: UsePaginationProps) {
  return useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    return {
      totalPages,
      start,
      end,
      hasPrev: page > 1,
      hasNext: page < totalPages,
      pages: Array.from({ length: totalPages }, (_, i) => i + 1),
    };
  }, [total, page, pageSize]);
}
