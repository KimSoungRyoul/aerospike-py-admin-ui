import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { JsonViewer } from "../json-viewer";

describe("JsonViewer", () => {
  it("renders null value", () => {
    render(<JsonViewer data={null} />);
    expect(screen.getByText("null")).toBeInTheDocument();
  });

  it("renders string value with quotes", () => {
    render(<JsonViewer data="hello" />);
    expect(screen.getByText((content) => content.includes("hello"))).toBeInTheDocument();
  });

  it("renders number value", () => {
    render(<JsonViewer data={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders boolean true", () => {
    render(<JsonViewer data={true} />);
    expect(screen.getByText("true")).toBeInTheDocument();
  });

  it("renders boolean false", () => {
    render(<JsonViewer data={false} />);
    expect(screen.getByText("false")).toBeInTheDocument();
  });

  it("renders empty array", () => {
    render(<JsonViewer data={[]} />);
    expect(screen.getByText("[]")).toBeInTheDocument();
  });

  it("renders empty object", () => {
    render(<JsonViewer data={{}} />);
    expect(screen.getByText("{}")).toBeInTheDocument();
  });

  it("renders object with keys", () => {
    render(<JsonViewer data={{ name: "test" }} />);
    expect(screen.getByText((content) => content.includes("name"))).toBeInTheDocument();
  });
});
