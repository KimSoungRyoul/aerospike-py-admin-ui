import { describe, it, expect } from "vitest";
import { cn, getErrorMessage } from "../utils";

describe("cn", () => {
  it("merges multiple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe("base active");
  });

  it("filters out falsy values", () => {
    expect(cn("a", null, undefined, false, 0, "b")).toBe("a b");
  });

  it("resolves Tailwind conflicts (last wins)", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });

  it("resolves Tailwind color conflicts", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("merges non-conflicting Tailwind classes", () => {
    expect(cn("px-4", "py-2", "mt-1")).toBe("px-4 py-2 mt-1");
  });

  it("handles array inputs", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("handles object syntax", () => {
    expect(cn({ active: true, disabled: false, visible: true })).toBe("active visible");
  });

  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("deduplicates identical Tailwind classes", () => {
    expect(cn("p-4", "p-4")).toBe("p-4");
  });
});

describe("getErrorMessage", () => {
  it("returns message from Error instances", () => {
    expect(getErrorMessage(new Error("something broke"))).toBe("something broke");
  });

  it("returns message from Error subclasses", () => {
    expect(getErrorMessage(new TypeError("type error"))).toBe("type error");
  });

  it("returns string errors directly", () => {
    expect(getErrorMessage("plain string error")).toBe("plain string error");
  });

  it("returns fallback for null", () => {
    expect(getErrorMessage(null)).toBe("An unknown error occurred");
  });

  it("returns fallback for undefined", () => {
    expect(getErrorMessage(undefined)).toBe("An unknown error occurred");
  });

  it("returns fallback for numbers", () => {
    expect(getErrorMessage(42)).toBe("An unknown error occurred");
  });

  it("returns fallback for objects", () => {
    expect(getErrorMessage({ error: "not an Error instance" })).toBe("An unknown error occurred");
  });

  it("returns fallback for boolean", () => {
    expect(getErrorMessage(false)).toBe("An unknown error occurred");
  });

  it("returns empty string for empty string input", () => {
    expect(getErrorMessage("")).toBe("");
  });
});
