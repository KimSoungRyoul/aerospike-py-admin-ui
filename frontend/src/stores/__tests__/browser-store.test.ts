import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBrowserStore } from "../browser-store";

vi.mock("@/lib/api/client", () => ({
  api: {
    getRecords: vi.fn(),
    putRecord: vi.fn(),
    deleteRecord: vi.fn(),
  },
}));

vi.mock("@/lib/constants", () => ({
  DEFAULT_PAGE_SIZE: 25,
}));

import { api } from "@/lib/api/client";
const mockApi = vi.mocked(api);

describe("useBrowserStore", () => {
  beforeEach(() => {
    useBrowserStore.getState().reset();
    vi.clearAllMocks();
  });

  it("has correct initial state", () => {
    const state = useBrowserStore.getState();
    expect(state.records).toEqual([]);
    expect(state.total).toBe(0);
    expect(state.page).toBe(1);
    expect(state.loading).toBe(false);
  });

  it("setPage updates page", () => {
    useBrowserStore.getState().setPage(3);
    expect(useBrowserStore.getState().page).toBe(3);
  });

  it("setPageSize updates pageSize and resets page", () => {
    useBrowserStore.getState().setPage(5);
    useBrowserStore.getState().setPageSize(50);
    expect(useBrowserStore.getState().pageSize).toBe(50);
    expect(useBrowserStore.getState().page).toBe(1);
  });

  it("setNamespace resets related state", () => {
    useBrowserStore.setState({ selectedSet: "test", records: [{ key: {} } as any], page: 3 });
    useBrowserStore.getState().setNamespace("test-ns");
    const state = useBrowserStore.getState();
    expect(state.selectedNamespace).toBe("test-ns");
    expect(state.selectedSet).toBeNull();
    expect(state.records).toEqual([]);
    expect(state.page).toBe(1);
  });

  it("fetchRecords populates state", async () => {
    const mockResult = {
      records: [{ key: { pk: "1" }, meta: {}, bins: {} }],
      total: 100,
      page: 1,
      pageSize: 25,
      hasMore: true,
    };
    mockApi.getRecords.mockResolvedValue(mockResult as any);

    await useBrowserStore.getState().fetchRecords("conn-1", "ns", "set");

    const state = useBrowserStore.getState();
    expect(state.records).toEqual(mockResult.records);
    expect(state.total).toBe(100);
    expect(state.loading).toBe(false);
  });

  it("fetchRecords sets error on failure", async () => {
    mockApi.getRecords.mockRejectedValue(new Error("Fetch failed"));

    await useBrowserStore.getState().fetchRecords("conn-1", "ns", "set");

    expect(useBrowserStore.getState().error).toBe("Fetch failed");
  });

  it("reset clears all state", () => {
    useBrowserStore.setState({
      records: [{ key: {} } as any],
      total: 100,
      page: 5,
      selectedNamespace: "ns",
      selectedSet: "set",
      error: "some error",
    });
    useBrowserStore.getState().reset();
    const state = useBrowserStore.getState();
    expect(state.records).toEqual([]);
    expect(state.total).toBe(0);
    expect(state.page).toBe(1);
    expect(state.selectedNamespace).toBeNull();
    expect(state.error).toBeNull();
  });
});
