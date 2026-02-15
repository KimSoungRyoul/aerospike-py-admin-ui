import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FullPageError } from "../full-page-error";
import { WifiOff } from "lucide-react";

describe("FullPageError", () => {
  it("renders default title", () => {
    render(<FullPageError />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders custom title and message", () => {
    render(<FullPageError title="Failed to load" message="Network error" />);
    expect(screen.getByText("Failed to load")).toBeInTheDocument();
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("renders retry button when onRetry is provided", () => {
    render(<FullPageError onRetry={() => {}} />);
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("does not render retry button when onRetry is not provided", () => {
    render(<FullPageError />);
    expect(screen.queryByText("Retry")).not.toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<FullPageError onRetry={onRetry} />);
    await user.click(screen.getByText("Retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders custom retry label", () => {
    render(<FullPageError onRetry={() => {}} retryLabel="Try Again" />);
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("renders custom icon", () => {
    const { container } = render(<FullPageError icon={WifiOff} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
