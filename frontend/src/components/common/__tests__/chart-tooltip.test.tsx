import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChartTooltipContent } from "../chart-tooltip";

describe("ChartTooltipContent", () => {
  it("renders nothing when not active", () => {
    const { container } = render(<ChartTooltipContent active={false} payload={[]} label="test" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when payload is empty", () => {
    const { container } = render(<ChartTooltipContent active={true} payload={[]} label="test" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders label and values when active with payload", () => {
    render(
      <ChartTooltipContent
        active={true}
        payload={[
          { name: "Reads", value: 1500, color: "#00aaff" },
          { name: "Writes", value: 800, color: "#ff5500" },
        ]}
        label="12:00:00"
      />,
    );
    expect(screen.getByText("12:00:00")).toBeInTheDocument();
    expect(screen.getByText("Reads:")).toBeInTheDocument();
    expect(screen.getByText("Writes:")).toBeInTheDocument();
  });

  it("uses custom valueFormatter", () => {
    render(
      <ChartTooltipContent
        active={true}
        payload={[{ name: "Test", value: 42, color: "#000" }]}
        label="label"
        valueFormatter={(v) => `${v}%`}
      />,
    );
    expect(screen.getByText("42%")).toBeInTheDocument();
  });
});
