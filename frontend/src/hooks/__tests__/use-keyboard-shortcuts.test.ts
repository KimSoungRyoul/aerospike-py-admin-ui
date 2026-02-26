import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts } from "../use-keyboard-shortcuts";

// Mock the ui-store
const mockToggleSidebar = vi.fn();

vi.mock("@/stores/ui-store", () => ({
  useUIStore: (selector: (state: { toggleSidebar: () => void }) => unknown) =>
    selector({ toggleSidebar: mockToggleSidebar }),
}));

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers keydown event listener on mount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    renderHook(() => useKeyboardShortcuts());

    expect(addSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    addSpy.mockRestore();
  });

  it("removes keydown event listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useKeyboardShortcuts());

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    removeSpy.mockRestore();
  });

  it("toggles sidebar on Ctrl+B", () => {
    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent("keydown", {
      key: "b",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
  });

  it("toggles sidebar on Meta+B (Cmd+B on macOS)", () => {
    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent("keydown", {
      key: "b",
      metaKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
  });

  it("prevents default on Ctrl+B", () => {
    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent("keydown", {
      key: "b",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");
    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("does not toggle sidebar on plain B key", () => {
    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent("keydown", {
      key: "b",
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(mockToggleSidebar).not.toHaveBeenCalled();
  });

  it("does not toggle sidebar on Ctrl with other keys", () => {
    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent("keydown", {
      key: "a",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(mockToggleSidebar).not.toHaveBeenCalled();
  });

  it("does not respond to events after unmount", () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts());
    unmount();

    const event = new KeyboardEvent("keydown", {
      key: "b",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(mockToggleSidebar).not.toHaveBeenCalled();
  });
});
