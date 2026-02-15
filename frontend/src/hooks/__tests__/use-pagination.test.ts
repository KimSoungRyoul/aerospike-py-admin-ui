import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePagination } from "../use-pagination";

describe("usePagination", () => {
  it("calculates totalPages correctly", () => {
    const { result } = renderHook(() => usePagination({ total: 100, page: 1, pageSize: 25 }));
    expect(result.current.totalPages).toBe(4);
  });

  it("returns at least 1 page for empty results", () => {
    const { result } = renderHook(() => usePagination({ total: 0, page: 1, pageSize: 25 }));
    expect(result.current.totalPages).toBe(1);
  });

  it("calculates start and end indices", () => {
    const { result } = renderHook(() => usePagination({ total: 100, page: 2, pageSize: 25 }));
    expect(result.current.start).toBe(26);
    expect(result.current.end).toBe(50);
  });

  it("caps end at total for last page", () => {
    const { result } = renderHook(() => usePagination({ total: 30, page: 2, pageSize: 25 }));
    expect(result.current.end).toBe(30);
  });

  it("hasPrev is false on first page", () => {
    const { result } = renderHook(() => usePagination({ total: 100, page: 1, pageSize: 25 }));
    expect(result.current.hasPrev).toBe(false);
  });

  it("hasPrev is true after first page", () => {
    const { result } = renderHook(() => usePagination({ total: 100, page: 2, pageSize: 25 }));
    expect(result.current.hasPrev).toBe(true);
  });

  it("hasNext is true when more pages exist", () => {
    const { result } = renderHook(() => usePagination({ total: 100, page: 1, pageSize: 25 }));
    expect(result.current.hasNext).toBe(true);
  });

  it("hasNext is false on last page", () => {
    const { result } = renderHook(() => usePagination({ total: 100, page: 4, pageSize: 25 }));
    expect(result.current.hasNext).toBe(false);
  });

  it("generates correct pages array", () => {
    const { result } = renderHook(() => usePagination({ total: 75, page: 1, pageSize: 25 }));
    expect(result.current.pages).toEqual([1, 2, 3]);
  });
});
