import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../data-table";

interface TestData {
  id: string;
  name: string;
  status: string;
}

const mockColumns: ColumnDef<TestData>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
];

const mockData: TestData[] = [
  { id: "1", name: "Item 1", status: "active" },
  { id: "2", name: "Item 2", status: "inactive" },
  { id: "3", name: "Item 3", status: "active" },
];

describe("DataTable", () => {
  it("renders table with data and columns", () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("shows skeleton loading state when loading=true and data is empty", () => {
    render(<DataTable data={[]} columns={mockColumns} loading={true} />);
    expect(screen.getByTestId("data-table-skeleton")).toBeInTheDocument();
  });

  it("shows loading bar when loading=true and data exists", () => {
    render(<DataTable data={mockData} columns={mockColumns} loading={true} />);
    const loadingBar = screen.getByTestId("data-table").querySelector(".loading-bar");
    expect(loadingBar).toBeInTheDocument();
  });

  it("shows empty state when data is empty and not loading", () => {
    render(<DataTable data={[]} columns={mockColumns} loading={false} />);
    expect(screen.getByText("No records")).toBeInTheDocument();
    expect(screen.getByText("No data available to display")).toBeInTheDocument();
  });

  it("renders custom empty state with icon/title/description/action", () => {
    const customEmptyState = (
      <div data-testid="custom-empty">
        <h2>Custom Empty</h2>
        <p>Custom description</p>
        <button>Custom Action</button>
      </div>
    );
    render(
      <DataTable data={[]} columns={mockColumns} loading={false} emptyState={customEmptyState} />,
    );
    expect(screen.getByTestId("custom-empty")).toBeInTheDocument();
    expect(screen.getByText("Custom Empty")).toBeInTheDocument();
    expect(screen.getByText("Custom description")).toBeInTheDocument();
    expect(screen.getByText("Custom Action")).toBeInTheDocument();
  });

  it("applies DaisyUI table class to table element", () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    const table = screen.getByTestId("data-table").querySelector("table");
    expect(table).toHaveClass("table");
  });

  it("includes data-testid attributes (table, head, body)", () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    expect(screen.getByTestId("data-table")).toBeInTheDocument();
    expect(screen.getByTestId("data-table-head")).toBeInTheDocument();
    expect(screen.getByTestId("data-table-body")).toBeInTheDocument();
  });

  it("row selection toggles work when enableRowSelection=true", async () => {
    const user = userEvent.setup();
    const onRowSelectionChange = vi.fn();
    const selectionColumns: ColumnDef<TestData>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            data-testid="select-all"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            data-testid={`select-row-${row.id}`}
          />
        ),
      },
      ...mockColumns,
    ];

    render(
      <DataTable
        data={mockData}
        columns={selectionColumns}
        rowSelection={{}}
        onRowSelectionChange={onRowSelectionChange}
      />,
    );

    const selectAllCheckbox = screen.getByTestId("select-all");
    expect(selectAllCheckbox).toBeInTheDocument();

    await user.click(selectAllCheckbox);
    expect(onRowSelectionChange).toHaveBeenCalled();
  });
});
