import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../status-badge";

describe("StatusBadge", () => {
  it("renders connected status", () => {
    render(<StatusBadge status="connected" />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("renders disconnected status", () => {
    render(<StatusBadge status="disconnected" />);
    expect(screen.getByText("Disconnected")).toBeInTheDocument();
  });

  it("renders custom label when provided", () => {
    render(<StatusBadge status="connected" label="Online" />);
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("renders ready status", () => {
    render(<StatusBadge status="ready" />);
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("renders building status", () => {
    render(<StatusBadge status="building" />);
    expect(screen.getByText("Building")).toBeInTheDocument();
  });

  it("renders error status", () => {
    render(<StatusBadge status="error" />);
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("renders warning status", () => {
    render(<StatusBadge status="warning" />);
    expect(screen.getByText("Warning")).toBeInTheDocument();
  });
});
