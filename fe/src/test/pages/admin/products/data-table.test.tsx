import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataTable } from "@/pages/admin/products/_components/data-table";

const columns = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }: { row: { getValue: (key: string) => string } }) =>
      row.getValue("name"),
  },
] as never;
const data = Array.from({ length: 20 }, (_, index) => ({
  name: `Product ${index + 1}`,
}));

function renderTable(
  overrides: Partial<{
    data: typeof data;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => Promise<{ isError: boolean }>;
  }> = {},
) {
  const fetchNextPage = vi.fn().mockResolvedValue({ isError: false });
  const view = render(
    <DataTable
      columns={columns}
      data={data}
      fetchNextPage={fetchNextPage}
      hasNextPage={false}
      isFetchingNextPage={false}
      {...overrides}
    />,
  );
  return { ...view, fetchNextPage };
}

describe("DataTable", () => {
  afterEach(() => cleanup());

  it("renders rows and prevents moving to a page before the first page", async () => {
    const user = userEvent.setup();
    renderTable();

    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Product 11")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByText("Product 1")).toBeInTheDocument();
  });

  it("shows empty state when there are no rows", () => {
    renderTable({ data: [] });

    expect(screen.getByText("No results.")).toBeInTheDocument();
  });

  it("renders grouped placeholder headers and selected rows", async () => {
    const user = userEvent.setup();
    const selectableColumns = [
      {
        header: "Group",
        columns: [
          {
            accessorKey: "name",
            header: "Name",
            size: null,
            cell: ({
              row,
            }: {
              row: {
                toggleSelected: () => void;
                getValue: (key: string) => string;
              };
            }) => (
              <button type="button" onClick={() => row.toggleSelected()}>
                {row.getValue("name")}
              </button>
            ),
          },
        ],
      },
      {
        accessorKey: "other",
        header: "Other",
      },
    ] as never;
    render(
      <DataTable
        columns={selectableColumns}
        data={data}
        fetchNextPage={vi.fn().mockResolvedValue({ isError: false })}
        hasNextPage={false}
        isFetchingNextPage={false}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Group" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Other" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Product 1" }));
    expect(screen.getByText("Product 1").closest("tr")).toHaveAttribute(
      "data-state",
      "selected",
    );
  });

  it("fetches the next page on the last loaded page and advances when fetch succeeds", async () => {
    const user = userEvent.setup();
    const { fetchNextPage, rerender } = renderTable({ hasNextPage: true });

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(fetchNextPage).toHaveBeenCalledOnce();
    expect(screen.getByText("Product 11")).toBeInTheDocument();
    rerender(
      <DataTable
        columns={columns}
        data={data}
        fetchNextPage={fetchNextPage}
        hasNextPage={false}
        isFetchingNextPage={false}
      />,
    );
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("keeps the current page when fetching the next page fails", async () => {
    const user = userEvent.setup();
    const fetchNextPage = vi.fn().mockResolvedValue({ isError: true });
    renderTable({ hasNextPage: true, fetchNextPage });

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Product 11")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(fetchNextPage).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Product 11")).toBeInTheDocument();
  });

  it("shows loading state and disables pagination while fetching", () => {
    renderTable({ hasNextPage: true, isFetchingNextPage: true });

    expect(screen.getByText("Loading more...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});
