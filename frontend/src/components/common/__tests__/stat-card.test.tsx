import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "../stat-card";
import { Activity } from "lucide-react";

describe("StatCard", () => {
  it("renders label and value", () => {
    render(<StatCard label="Read Requests" value="1,234" icon={Activity} />);
    expect(screen.getByText("Read Requests")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(
      <StatCard
        label="Reads"
        value={100}
        icon={Activity}
        subtitle="99.9% success"
      />,
    );
    expect(screen.getByText("99.9% success")).toBeInTheDocument();
  });

  it("does not render subtitle when not provided", () => {
    render(<StatCard label="Reads" value={100} icon={Activity} />);
    expect(screen.queryByText("success")).not.toBeInTheDocument();
  });

  it("renders icon", () => {
    const { container } = render(
      <StatCard label="Test" value={0} icon={Activity} />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
