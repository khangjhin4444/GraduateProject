import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminProductEntity } from "@/features/admin/schema/admin.schema";
import useAdminProductDetail from "@/hooks/useAdminProductDetail";
import ProductTable from "@/pages/admin/products/_components/product-table";

const inViewState = vi.hoisted(() => ({ inView: false }));

vi.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: vi.fn(), inView: inViewState.inView }),
}));
vi.mock("@/hooks/useAdminProductDetail", () => ({ default: vi.fn() }));
vi.mock("@/pages/admin/products/_components/data-table", () => ({
  DataTable: ({
    columns,
    data,
  }: {
    columns: {
      id?: string;
      cell?: (context: { row: { original: AdminProductEntity } }) => React.ReactNode;
    }[];
    data: AdminProductEntity[];
  }) => {
    const actions = columns.find((column) => column.id === "actions");
    return (
      <div>
        <span data-testid="table-row-count">{data.length}</span>
        {data.map((row, index) => (
          <div key={row.VariantID}>
            {actions?.cell?.({ row: { original: row } })}
            <span>{`row-${index}`}</span>
          </div>
        ))}
        {actions?.cell?.({
          row: {
            original: { ...data[0], ProductID: -1 },
          },
        })}
      </div>
    );
  },
}));
vi.mock("@/pages/admin/products/_components/ProductFormDialog", () => ({
  ProductFormDialog: ({
    open,
    initType,
    onSaved,
  }: {
    open: boolean;
    initType: string;
    onSaved: (type: string) => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Add product dialog">
        <span>{initType}</span>
        <button type="button" onClick={() => onSaved(initType)}>
          Save new product
        </button>
      </div>
    ) : null,
}));
vi.mock("@/pages/admin/products/_components/EditProductFormDialog", () => ({
  EditProductFormDialog: ({
    productData,
    open,
    onOpenChange,
    onSaved,
  }: {
    productData: { ProductID: number; variants: { VariantID: number }[] };
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: (type: string) => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Edit product dialog">
        <span>{`product-${productData.ProductID}`}</span>
        <span>{`variants-${productData.variants.map((variant) => variant.VariantID).join(",")}`}</span>
        <button type="button" onClick={() => onSaved("KeyboardKit")}>
          Save edit
        </button>
        <button type="button" onClick={() => onOpenChange(true)}>
          Keep edit open
        </button>
        <button type="button" onClick={() => onOpenChange(false)}>
          Close edit
        </button>
      </div>
    ) : null,
}));

const productRows: AdminProductEntity[] = [
  {
    ProductID: 10,
    VariantID: 101,
    Name: "Keyboard",
    Description: { blocks: [{ type: "paragraph", data: { text: "Keyboard" } }] },
    ProductType: "KeyboardKit",
    SubType: "75%",
    Color: "Black",
    Price: 1000,
    Stock: 5,
    MainImage: "/black.jpg",
    ExtraImages: ["/extra.jpg"],
  },
  {
    ProductID: 10,
    VariantID: 102,
    Name: "Keyboard",
    Description: { blocks: [{ type: "paragraph", data: { text: "Keyboard" } }] },
    ProductType: "KeyboardKit",
    SubType: "75%",
    Color: "White",
    Price: 1200,
    Stock: 3,
    MainImage: "/white.jpg",
    ExtraImages: ["/extra.jpg"],
  },
];

function renderProductTable(type = "KeyboardKit") {
  const queryClient = new QueryClient();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const view = render(
    <QueryClientProvider client={queryClient}>
      <ProductTable type={type} />
    </QueryClientProvider>,
  );
  return { ...view, invalidateQueries };
}

describe("Admin ProductTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inViewState.inView = true;
    vi.mocked(useAdminProductDetail).mockReturnValue({
      data: { pages: [{ data: productRows, hasNextPage: false }] },
      isPending: false,
      fetchNextPage: vi.fn(),
      isFetchingNextPage: false,
      isError: false,
      error: null,
    } as never);
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a loading skeleton before entering the viewport and reports query errors", () => {
    inViewState.inView = false;
    vi.mocked(useAdminProductDetail).mockReturnValue({
      data: undefined,
      isPending: true,
      fetchNextPage: vi.fn(),
      isFetchingNextPage: false,
      isError: true,
      error: new Error("Product load failed"),
    } as never);

    renderProductTable();

    expect(screen.getByText("Product load failed")).toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByRole("button", { name: "Add Product" })).toBeNull();
    expect(useAdminProductDetail).toHaveBeenCalledWith({
      type: "KeyboardKit",
      enable: false,
    });
  });

  it("renders an empty table when product data has not been returned", async () => {
    const user = userEvent.setup();
    vi.mocked(useAdminProductDetail).mockReturnValue({
      data: undefined,
      isPending: false,
      fetchNextPage: vi.fn(),
      isFetchingNextPage: false,
      isError: false,
      error: null,
    } as never);

    renderProductTable("Switch");

    expect(screen.getByRole("heading", { name: "Switch" })).toBeInTheDocument();
    expect(screen.getByTestId("table-row-count")).toHaveTextContent("0");
    await user.click(screen.getByRole("button", { name: "Edit product" }));
    expect(
      screen.queryByRole("dialog", { name: "Edit product dialog" }),
    ).not.toBeInTheDocument();
  });

  it("opens the add dialog and invalidates the matching product query after save", async () => {
    const user = userEvent.setup();
    const { invalidateQueries } = renderProductTable();

    expect(screen.getByRole("heading", { name: "Keyboard Kit" })).toBeInTheDocument();
    expect(screen.getByTestId("table-row-count")).toHaveTextContent("2");
    await user.click(screen.getByRole("button", { name: "Add Product" }));

    expect(screen.getByRole("dialog", { name: "Add product dialog" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Save new product" }));
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["admin-products", "KeyboardKit"],
    });
  });

  it("groups matching variants for editing, ignores missing products, and clears edit state on close", async () => {
    const user = userEvent.setup();
    const { invalidateQueries } = renderProductTable();

    await user.click(screen.getAllByRole("button", { name: "Edit product" })[0]);
    expect(screen.getByRole("dialog", { name: "Edit product dialog" })).toBeVisible();
    expect(screen.getByText("product-10")).toBeInTheDocument();
    expect(screen.getByText("variants-101,102")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save edit" }));
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["admin-products", "KeyboardKit"],
    });

    await user.click(screen.getByRole("button", { name: "Keep edit open" }));
    expect(screen.getByRole("dialog", { name: "Edit product dialog" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Close edit" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Edit product dialog" }),
      ).not.toBeInTheDocument(),
    );
    await user.click(
      screen.getAllByRole("button", { name: "Edit product" }).at(-1)!,
    );
    expect(
      screen.queryByRole("dialog", { name: "Edit product dialog" }),
    ).not.toBeInTheDocument();
  });
});
