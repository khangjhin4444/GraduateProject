import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { AdminUsecase } from "@/features/admin/usecase/admin.usecase";
import useAdminProductDetail from "@/hooks/useAdminProductDetail";
import ProductTable from "@/pages/admin/products/_components/product-table";
import type { AdminProductEntity } from "@/features/admin/schema/admin.schema";

const inViewState = vi.hoisted(() => ({ inView: true }));
const editorMock = vi.hoisted(() => ({ save: vi.fn(), destroy: vi.fn() }));

vi.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: vi.fn(), inView: inViewState.inView }),
}));

vi.mock("@/hooks/useAdminProductDetail", () => ({ default: vi.fn() }));

vi.mock("@editorjs/editorjs", () => ({
  default: vi.fn(function EditorJS() {
    return editorMock;
  }),
}));

vi.mock("@/features/admin/usecase/admin.usecase", () => ({
  AdminUsecase: {
    addProduct: vi.fn(),
    editProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const productRows: AdminProductEntity[] = [
  {
    ProductID: 10,
    VariantID: 101,
    Name: "Keyboard",
    Description: {
      blocks: [{ type: "paragraph", data: { text: "Keyboard description" } }],
    },
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
    Description: {
      blocks: [{ type: "paragraph", data: { text: "Keyboard description" } }],
    },
    ProductType: "KeyboardKit",
    SubType: "75%",
    Color: "White",
    Price: 1200,
    Stock: 3,
    MainImage: "/white.jpg",
    ExtraImages: ["/extra.jpg"],
  },
];

function renderProductTable() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const view = render(
    <QueryClientProvider client={queryClient}>
      <ProductTable type="KeyboardKit" />
    </QueryClientProvider>,
  );

  return { ...view, invalidateQueries };
}

async function submitDialog(user: ReturnType<typeof userEvent.setup>) {
  const nameInput = screen.getByPlaceholderText("Product name");
  await user.click(nameInput);
  const form = nameInput.closest("form");
  if (!form) throw new Error("Product form was not rendered");
  form.requestSubmit();
}

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "PointerEvent",
    class extends Event {
      constructor(type: string, props: PointerEventInit) {
        super(type, props);
      }
    },
  );
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe("ProductTable integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inViewState.inView = true;
    editorMock.save.mockResolvedValue({
      time: 1,
      blocks: [
        { type: "paragraph", data: { text: "Saved product description" } },
      ],
      version: "2.31.7",
    });
    vi.mocked(useAdminProductDetail).mockReturnValue({
      data: { pages: [{ data: productRows, hasNextPage: false }] },
      isPending: false,
      fetchNextPage: vi.fn(),
      isFetchingNextPage: false,
      isError: false,
      error: null,
    } as never);
    vi.mocked(AdminUsecase.addProduct).mockResolvedValue({
      success: true,
      message: "Product created",
    });
    vi.mocked(AdminUsecase.editProduct).mockResolvedValue({
      success: true,
      message: "Product updated",
    });
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:product-image"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("opens and submits the real new-product form from the real data table", async () => {
    const user = userEvent.setup();
    const { invalidateQueries } = renderProductTable();

    expect(
      screen.getByRole("heading", { name: "Keyboard Kit" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add Product" }));

    expect(screen.getByRole("heading", { name: "New product" })).toBeVisible();
    await user.type(
      screen.getByPlaceholderText("Product name"),
      "New keyboard",
    );
    await user.type(screen.getByPlaceholderText("Black"), "Black");
    const [priceInput, stockInput] = screen.getAllByPlaceholderText("0");
    await user.type(priceInput, "1250");
    await user.type(stockInput, "8");

    const variantImage = new File(["variant"], "variant.jpg", {
      type: "image/jpeg",
    });
    const variantImageInput = screen.getByTestId(
      "image-input",
    ) as HTMLInputElement;

    await user.upload(variantImageInput, variantImage);
    await submitDialog(user);

    await waitFor(() => expect(AdminUsecase.addProduct).toHaveBeenCalledOnce());
    const [formData] = vi.mocked(AdminUsecase.addProduct).mock.calls[0];
    expect(formData.get("name")).toBe("New keyboard");
    expect(formData.get("productType")).toBe("KeyboardKit");
    expect(formData.getAll("variantImages")).toEqual([variantImage]);
    expect(JSON.parse(String(formData.get("variants")))).toEqual([
      { color: "Black", price: 1250, stock: 8 },
    ]);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["admin-products", "KeyboardKit"],
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "New product" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("opens and submits the real edit form with grouped variants from the real data table", async () => {
    const user = userEvent.setup();
    const { invalidateQueries } = renderProductTable();

    await user.click(
      screen.getAllByRole("button", { name: "Edit product" })[0],
    );

    expect(screen.getByRole("heading", { name: "Edit product" })).toBeVisible();
    expect(screen.getByPlaceholderText("Product name")).toHaveValue("Keyboard");
    expect(screen.getAllByPlaceholderText("Black")).toHaveLength(2);
    expect(screen.getAllByPlaceholderText("Black")[1]).toHaveValue("White");

    await user.clear(screen.getByPlaceholderText("Product name"));
    await user.type(
      screen.getByPlaceholderText("Product name"),
      "Updated keyboard",
    );
    await submitDialog(user);

    await waitFor(() =>
      expect(AdminUsecase.editProduct).toHaveBeenCalledOnce(),
    );
    const [productId, formData] = vi.mocked(AdminUsecase.editProduct).mock
      .calls[0];
    expect(productId).toBe(10);
    expect(formData.get("name")).toBe("Updated keyboard");
    expect(JSON.parse(String(formData.get("variants")))).toEqual([
      {
        variantId: 101,
        color: "Black",
        price: 1000,
        stock: 5,
        existingImage: "/black.jpg",
      },
      {
        variantId: 102,
        color: "White",
        price: 1200,
        stock: 3,
        existingImage: "/white.jpg",
      },
    ]);
    expect(formData.get("existingExtraImages")).toBe(
      JSON.stringify(["/extra.jpg"]),
    );
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["admin-products", "KeyboardKit"],
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Edit product" }),
      ).not.toBeInTheDocument(),
    );
  });
  it("reset editData each time open dialog", async () => {
    const user = userEvent.setup();
    renderProductTable();

    await user.click(
      screen.getAllByRole("button", { name: "Edit product" })[0],
    );
    expect(screen.getByRole("heading", { name: "Edit product" })).toBeVisible();
    await user.clear(screen.getByPlaceholderText("Product name"));
    await user.type(
      screen.getByPlaceholderText("Product name"),
      "Updated keyboard",
    );
    await user.keyboard("{Escape}");

    await user.click(
      screen.getAllByRole("button", { name: "Edit product" })[1],
    );
    expect(screen.getByRole("heading", { name: "Edit product" })).toBeVisible();
    expect(screen.getByPlaceholderText("Product name")).toHaveValue("Keyboard");
  });
});
