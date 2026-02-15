import { describe, it, expect, beforeEach } from "vitest";

// Force re-import of the store fresh with working localStorage
describe("useUIStore", () => {
  let useUIStore: typeof import("../ui-store").useUIStore;

  beforeEach(async () => {
    // Dynamically import to get fresh store
    const mod = await import("../ui-store");
    useUIStore = mod.useUIStore;
    useUIStore.setState({
      theme: "system",
      sidebarOpen: true,
      activeTab: null,
    });
  });

  it("has correct initial state", () => {
    const state = useUIStore.getState();
    expect(state.theme).toBe("system");
    expect(state.sidebarOpen).toBe(true);
    expect(state.activeTab).toBeNull();
  });

  it("setTheme updates theme", () => {
    useUIStore.getState().setTheme("dark");
    expect(useUIStore.getState().theme).toBe("dark");
  });

  it("setTheme to light", () => {
    useUIStore.getState().setTheme("light");
    expect(useUIStore.getState().theme).toBe("light");
  });

  it("toggleSidebar toggles state", () => {
    expect(useUIStore.getState().sidebarOpen).toBe(true);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it("setSidebarOpen sets explicit value", () => {
    useUIStore.getState().setSidebarOpen(false);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it("setActiveTab updates activeTab", () => {
    useUIStore.getState().setActiveTab("browser");
    expect(useUIStore.getState().activeTab).toBe("browser");
  });
});
