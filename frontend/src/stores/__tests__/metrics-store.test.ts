import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useMetricsStore } from "../metrics-store";

vi.mock("@/lib/api/client", () => ({
  api: {
    getMetrics: vi.fn(),
  },
}));

vi.mock("@/lib/constants", () => ({
  METRIC_INTERVAL_MS: 5000,
}));

import { api } from "@/lib/api/client";
const mockApi = vi.mocked(api);

describe("useMetricsStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useMetricsStore.setState({
      metrics: null,
      loading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    useMetricsStore.getState().stopPolling();
    vi.useRealTimers();
  });

  it("has correct initial state", () => {
    const state = useMetricsStore.getState();
    expect(state.metrics).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("fetchMetrics populates metrics", async () => {
    const mockMetrics = { connectionId: "1", connected: true, uptime: 3600 };
    mockApi.getMetrics.mockResolvedValue(mockMetrics as any);

    await useMetricsStore.getState().fetchMetrics("conn-1");

    expect(useMetricsStore.getState().metrics).toEqual(mockMetrics);
    expect(useMetricsStore.getState().loading).toBe(false);
  });

  it("fetchMetrics sets error on failure", async () => {
    mockApi.getMetrics.mockRejectedValue(new Error("Timeout"));

    await useMetricsStore.getState().fetchMetrics("conn-1");

    expect(useMetricsStore.getState().error).toBe("Timeout");
  });

  it("startPolling begins interval and fetches immediately", async () => {
    mockApi.getMetrics.mockResolvedValue({ connectionId: "1" } as any);

    useMetricsStore.getState().startPolling("conn-1");

    expect(mockApi.getMetrics).toHaveBeenCalledTimes(1);
  });

  it("stopPolling resets _isFetching", () => {
    mockApi.getMetrics.mockResolvedValue({} as any);

    useMetricsStore.getState().startPolling("conn-1");
    useMetricsStore.getState().stopPolling();

    expect(useMetricsStore.getState()._isFetching).toBe(false);
  });
});
