import { describe, it, expect, vi, beforeEach } from "vitest";
import { useConnectionStore } from "../connection-store";

// Mock the API client
vi.mock("@/lib/api/client", () => ({
  api: {
    getConnections: vi.fn(),
    createConnection: vi.fn(),
    updateConnection: vi.fn(),
    deleteConnection: vi.fn(),
    testConnection: vi.fn(),
  },
}));

import { api } from "@/lib/api/client";
const mockApi = vi.mocked(api);

describe("useConnectionStore", () => {
  beforeEach(() => {
    useConnectionStore.setState({
      connections: [],
      selectedConnectionId: null,
      loading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it("has correct initial state", () => {
    const state = useConnectionStore.getState();
    expect(state.connections).toEqual([]);
    expect(state.selectedConnectionId).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("selectConnection sets selectedConnectionId", () => {
    useConnectionStore.getState().selectConnection("conn-1");
    expect(useConnectionStore.getState().selectedConnectionId).toBe("conn-1");
  });

  it("selectConnection sets null", () => {
    useConnectionStore.getState().selectConnection("conn-1");
    useConnectionStore.getState().selectConnection(null);
    expect(useConnectionStore.getState().selectedConnectionId).toBeNull();
  });

  it("fetchConnections sets loading and populates connections", async () => {
    const mockConnections = [
      {
        id: "1",
        name: "Test",
        hosts: ["localhost"],
        port: 3000,
        color: "#000",
        status: { connected: true, nodeCount: 1, namespaceCount: 2 },
      },
    ];
    mockApi.getConnections.mockResolvedValue(mockConnections as any);

    await useConnectionStore.getState().fetchConnections();

    const state = useConnectionStore.getState();
    expect(state.connections).toEqual(mockConnections);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("fetchConnections sets error on failure", async () => {
    mockApi.getConnections.mockRejectedValue(new Error("Network error"));

    await useConnectionStore.getState().fetchConnections();

    const state = useConnectionStore.getState();
    expect(state.error).toBe("Network error");
    expect(state.loading).toBe(false);
  });

  it("createConnection calls API and refreshes list", async () => {
    mockApi.createConnection.mockResolvedValue({} as any);
    mockApi.getConnections.mockResolvedValue([]);

    await useConnectionStore.getState().createConnection({ name: "New" });

    expect(mockApi.createConnection).toHaveBeenCalledWith({ name: "New" });
    expect(mockApi.getConnections).toHaveBeenCalled();
  });

  it("deleteConnection clears selectedConnectionId if matching", async () => {
    useConnectionStore.setState({ selectedConnectionId: "conn-1" });
    mockApi.deleteConnection.mockResolvedValue(undefined as any);
    mockApi.getConnections.mockResolvedValue([]);

    await useConnectionStore.getState().deleteConnection("conn-1");

    expect(useConnectionStore.getState().selectedConnectionId).toBeNull();
  });

  it("testConnection returns result on success", async () => {
    mockApi.testConnection.mockResolvedValue({ success: true, message: "OK" });

    const result = await useConnectionStore.getState().testConnection("conn-1");

    expect(result).toEqual({ success: true, message: "OK" });
  });

  it("testConnection returns error result on failure", async () => {
    mockApi.testConnection.mockRejectedValue(new Error("Connection refused"));

    const result = await useConnectionStore.getState().testConnection("conn-1");

    expect(result).toEqual({ success: false, message: "Connection refused" });
  });
});
