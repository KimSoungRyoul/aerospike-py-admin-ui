import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "../confirm-dialog";

// Mock showModal/close for jsdom (not supported natively)
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("ConfirmDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: "Delete Item",
    description: "Are you sure you want to delete this item?",
    onConfirm: vi.fn(),
  };

  it("renders title and description when open", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Delete Item")).toBeInTheDocument();
    expect(screen.getByText("Are you sure you want to delete this item?")).toBeInTheDocument();
  });

  it("renders default button labels", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("renders custom button labels", () => {
    render(
      <ConfirmDialog {...defaultProps} confirmLabel="Delete" cancelLabel="Go Back" />,
    );
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Go Back")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    await user.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows loading state", () => {
    render(<ConfirmDialog {...defaultProps} loading />);
    expect(screen.getByText("Processing...")).toBeInTheDocument();
  });

  it("disables buttons when loading", () => {
    render(<ConfirmDialog {...defaultProps} loading />);
    expect(screen.getByText("Cancel")).toBeDisabled();
    expect(screen.getByText("Processing...")).toBeDisabled();
  });
});
