import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "../page-header";

describe("PageHeader", () => {
  it("renders title as h1", () => {
    render(<PageHeader title="Cluster Overview" />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Cluster Overview");
  });

  it("renders description when provided", () => {
    render(<PageHeader title="Test" description="Some description text" />);
    expect(screen.getByText("Some description text")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    const { container } = render(<PageHeader title="Test" />);
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("renders actions when provided", () => {
    render(<PageHeader title="Test" actions={<button>Refresh</button>} />);
    expect(screen.getByText("Refresh")).toBeInTheDocument();
  });

  it("renders ReactNode description", () => {
    render(<PageHeader title="Test" description={<span data-testid="custom-desc">Custom</span>} />);
    expect(screen.getByTestId("custom-desc")).toBeInTheDocument();
  });
});
