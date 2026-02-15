import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../empty-state";
import { Database } from "lucide-react";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No data" />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="No data" description="Nothing to show here" />);
    expect(screen.getByText("Nothing to show here")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<EmptyState title="No data" />);
    expect(screen.queryByText("Nothing to show here")).not.toBeInTheDocument();
  });

  it("renders action when provided", () => {
    render(
      <EmptyState
        title="No data"
        action={<button>Add Item</button>}
      />,
    );
    expect(screen.getByText("Add Item")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    const { container } = render(<EmptyState title="No data" icon={Database} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
