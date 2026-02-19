import { describe, it, expect, vi, beforeEach } from "vitest";
import { useQueryStore } from "../query-store";

vi.mock("@/lib/api/client", () => ({
  api: {
    executeQuery: vi.fn(),
  },
}));

import { api } from "@/lib/api/client";
const mockApi = vi.mocked(api);

describe("useQueryStore", () => {
  beforeEach(() => {
    useQueryStore.getState().reset();
    vi.clearAllMocks();
  });

  it("has correct initial state", () => {
    const state = useQueryStore.getState();
    expect(state.namespace).toBe("");
    expect(state.maxRecords).toBe(100);
    expect(state.hasExecuted).toBe(false);
  });

  it("setNamespace updates namespace", () => {
    useQueryStore.getState().setNamespace("test-ns");
    expect(useQueryStore.getState().namespace).toBe("test-ns");
  });

  it("executeQuery calls API and updates results", async () => {
    useQueryStore.setState({ namespace: "test-ns" });
    const mockResult = {
      records: [{ key: { pk: "1" }, meta: {}, bins: {} }],
      executionTimeMs: 42,
      scannedRecords: 1000,
      returnedRecords: 1,
    };
    mockApi.executeQuery.mockResolvedValue(mockResult as any);

    await useQueryStore.getState().executeQuery("conn-1");

    const state = useQueryStore.getState();
    expect(state.results).toEqual(mockResult.records);
    expect(state.executionTimeMs).toBe(42);
    expect(state.hasExecuted).toBe(true);
    expect(state.loading).toBe(false);
  });

  it("executeQuery sets error on failure", async () => {
    useQueryStore.setState({ namespace: "test-ns" });
    mockApi.executeQuery.mockRejectedValue(new Error("Query failed"));

    await useQueryStore.getState().executeQuery("conn-1");

    expect(useQueryStore.getState().error).toBe("Query failed");
    expect(useQueryStore.getState().loading).toBe(false);
  });

  it("reset clears all query state", () => {
    useQueryStore.setState({
      namespace: "ns",
      primaryKey: "pk-123",
      results: [{ key: {} } as any],
      hasExecuted: true,
      error: "err",
    });
    useQueryStore.getState().reset();
    const state = useQueryStore.getState();
    expect(state.namespace).toBe("");
    expect(state.primaryKey).toBe("");
    expect(state.results).toEqual([]);
    expect(state.hasExecuted).toBe(false);
    expect(state.error).toBeNull();
  });
});
