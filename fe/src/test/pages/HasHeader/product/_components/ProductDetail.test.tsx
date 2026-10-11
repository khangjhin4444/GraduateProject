import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNavigate, useParams } from "react-router";
import useProductDetail from "@/hooks/useProductDetail";
import useRelevant from "@/hooks/useRelevant";
import { useAddToCart } from "@/hooks/useAddToCart";
import { toast } from "sonner";
import ProductDetail from "@/pages/HasHeader/product/_components/ProductDetail";

const renderTracker = vi.hoisted(() => ({ blocks: 0 }));

vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useNavigate: vi.fn(), useParams: vi.fn() };
});
vi.mock("@/hooks/useProductDetail", () => ({ default: vi.fn() }));
vi.mock("@/hooks/useRelevant", () => ({ default: vi.fn() }));
vi.mock("@/hooks/useAddToCart", () => ({ useAddToCart: vi.fn() }));
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { promise: vi.fn(), error: vi.fn() }),
}));
vi.mock("@/shared/components/BlockRender", () => ({
  Blocks: () => {
    renderTracker.blocks += 1;
    return <div data-testid="product-description">Description blocks</div>;
  },
  customRender: {},
}));
vi.mock("@/pages/HasHeader/product/_components/RelevantProductCard", () => ({
  RelevantProductCard: ({ product }: { product: { Name: string } }) => (
    <div data-testid="relevant-product">{product.Name}</div>
  ),
}));
vi.mock("@/shared/components/ProductSkeleton", () => ({
  default: () => <div data-testid="relevant-skeleton">Loading products</div>,
}));

const product = {
  ProductID: 7,
  Name: "Mechanical Keyboard",
  ProductType: "KeyboardKit",
  SubType: "75%",
  Description: { blocks: [] },
  images: ["/detail.jpg"],
  variants: [
    {
      VariantID: 101,
      Color: "Black",
      Price: 100000,
      Stock: 0,
      MainImage: "/black.jpg",
    },
    {
      VariantID: 102,
      Color: "White",
      Price: 120000,
      Stock: 0,
      MainImage: "/white.jpg",
    },
    {
      VariantID: 103,
      Color: "Red",
      Price: 130000,
      Stock: 3,
      MainImage: "/red.jpg",
    },
  ],
};
const product2 = {
  ProductID: 7,
  Name: "Mechanical Keyboard",
  ProductType: "KeyboardKit",
  SubType: "75%",
  Description: { blocks: [] },
  images: ["/detail.jpg"],
  variants: [
    {
      VariantID: 101,
      Color: "Black",
      Price: 100000,
      Stock: 5,
      MainImage: "/black.jpg",
    },
    {
      VariantID: 102,
      Color: "White",
      Price: 120000,
      Stock: 0,
      MainImage: "/white.jpg",
    },
    {
      VariantID: 103,
      Color: "Red",
      Price: 130000,
      Stock: 3,
      MainImage: "/red.jpg",
    },
  ],
};
const relevantProducts = [
  {
    ProductID: 8,
    Name: "Matching Kit",
    Description: { blocks: [] },
    MainImage: "/kit.jpg",
    Price: "50000",
  },
];
const mutateAsync = vi.fn();
const navigate = vi.fn();

function renderProductDetail() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <ProductDetail />
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

describe("ProductDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useParams).mockReturnValue({ id: "7" });
    vi.mocked(useNavigate).mockReturnValue(navigate);
    vi.mocked(useProductDetail).mockReturnValue({
      data: { data: product },
      isSuccess: true,
    } as never);
    vi.mocked(useRelevant).mockReturnValue({
      data: { data: relevantProducts },
      isLoading: false,
    } as never);
    mutateAsync.mockResolvedValue({ message: "Added to cart" });
    vi.mocked(useAddToCart).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);
  });

  afterEach(() => cleanup());

  it("renders product information using the first in-stock variant", () => {
    renderProductDetail();

    expect(
      screen.getByRole("heading", { name: "Mechanical Keyboard" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Main Product" })).toHaveAttribute(
      "src",
      "/red.jpg",
    );
    expect(screen.getByText("130.000 VND")).toBeInTheDocument();
    expect(screen.getByText("Stock: 3")).toBeInTheDocument();
    expect(screen.getByTestId("product-description")).toBeInTheDocument();
    expect(screen.getByTestId("relevant-product")).toHaveTextContent(
      "Matching Kit",
    );
    expect(useProductDetail).toHaveBeenCalledWith(7);
    expect(useRelevant).toHaveBeenCalledWith({
      type: "KeyboardKit",
      id: 7,
      enable: true,
    });
  });

  it("changes the active variant and disables out-of-stock variants", async () => {
    const user = userEvent.setup();
    vi.mocked(useProductDetail).mockReturnValue({
      data: { data: product2 },
      isSuccess: true,
    } as never);
    renderProductDetail();

    const outOfStockVariant = screen.getByTitle("Out of stock");
    expect(outOfStockVariant).toBeDisabled();

    await user.click(screen.getByTitle("Red"));

    expect(screen.getByRole("img", { name: "Main Product" })).toHaveAttribute(
      "src",
      "/red.jpg",
    );
    expect(screen.getByText("130.000 VND")).toBeInTheDocument();
    expect(screen.getByText("Stock: 3")).toBeInTheDocument();
  });

  it("uses a selected thumbnail as the main product image", async () => {
    const user = userEvent.setup();
    renderProductDetail();

    await user.click(screen.getByRole("img", { name: "Thumbnail 3" }));

    expect(screen.getByRole("img", { name: "Main Product" })).toHaveAttribute(
      "src",
      "/detail.jpg",
    );
  });

  it("zooms the main image while the pointer is over it and hides zoom on leave", () => {
    renderProductDetail();
    const blocksRenderCount = renderTracker.blocks;
    const imageContainer = screen.getByRole("img", {
      name: "Main Product",
    }).parentElement!;
    vi.spyOn(imageContainer, "getBoundingClientRect").mockReturnValue({
      left: 10,
      top: 20,
      width: 200,
      height: 100,
      right: 210,
      bottom: 120,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    });

    fireEvent.mouseMove(imageContainer, { clientX: 110, clientY: 70 });

    const zoomOverlay = imageContainer.querySelector(
      'div[style*="background-image"]',
    );
    expect(zoomOverlay).toHaveStyle({ backgroundPosition: "50% 50%" });
    expect(screen.getByRole("img", { name: "Main Product" })).toHaveClass(
      "opacity-80",
    );
    expect(renderTracker.blocks).toBe(blocksRenderCount);

    fireEvent.mouseLeave(imageContainer);

    expect(
      imageContainer.querySelector('div[style*="background-image"]'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Main Product" })).toHaveClass(
      "opacity-100",
    );
    expect(renderTracker.blocks).toBe(blocksRenderCount);
  });

  it("restores the selected variant image after choosing a thumbnail", async () => {
    const user = userEvent.setup();
    renderProductDetail();

    await user.click(screen.getByRole("img", { name: "Thumbnail 3" }));
    expect(screen.getByRole("img", { name: "Main Product" })).toHaveAttribute(
      "src",
      "/detail.jpg",
    );

    await user.click(screen.getByTitle("Red"));

    expect(screen.getByRole("img", { name: "Main Product" })).toHaveAttribute(
      "src",
      "/red.jpg",
    );
  });

  it("adds the selected variant and quantity to the cart", async () => {
    const user = userEvent.setup();
    renderProductDetail();

    await user.click(screen.getByTitle("Red"));
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "2" },
    });
    await user.click(screen.getByRole("button", { name: "ADD TO CART" }));

    expect(mutateAsync).toHaveBeenCalledWith({ variantId: 103, quantity: 2 });
    expect(toast.promise).toHaveBeenCalledOnce();
  });

  it("shows the pending label while an add-to-cart request is in progress", () => {
    vi.mocked(useAddToCart).mockReturnValue({
      mutateAsync,
      isPending: true,
    } as never);

    renderProductDetail();

    expect(screen.getByRole("button", { name: "ADDING..." })).toBeDisabled();
  });

  it("resets an invalid cart quantity and submitting", async () => {
    const user = userEvent.setup();
    renderProductDetail();
    const quantityInput = screen.getByRole("spinbutton");

    await user.clear(quantityInput);
    await user.type(quantityInput, "0");
    await user.click(screen.getByRole("button", { name: "ADD TO CART" }));

    expect(quantityInput).toHaveValue(1);
    expect(mutateAsync).toHaveBeenCalled();
    expect(toast.promise).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "BUY NOW" }));
    expect(quantityInput).toHaveValue(1);
    expect(navigate).toHaveBeenCalled();
  });

  it("returns cart success and error messages and refreshes the product on stock errors", async () => {
    const { queryClient } = renderProductDetail();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    fireEvent.click(screen.getByRole("button", { name: "ADD TO CART" }));

    const [, options] = vi.mocked(toast.promise).mock.calls[0];
    if (!options || typeof options === "string") {
      throw new Error("Expected toast.promise options");
    }
    if (
      typeof options.success !== "function" ||
      typeof options.error !== "function"
    ) {
      throw new Error("Expected toast success and error handlers");
    }
    expect(options.success({ message: "Added to cart" })).toBe("Added to cart");
    expect(options.error(new Error("Something went wrong"))).toBe(
      "Something went wrong",
    );
    expect(options.error(new Error("out of stock"))).toBe("out of stock");
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["product", "7"],
    });
    expect(invalidateQueries).toHaveBeenCalledOnce();
  });

  it("navigates to checkout with the selected variant when buying now", async () => {
    const user = userEvent.setup();
    renderProductDetail();

    await user.click(screen.getByTitle("Red"));
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "2" },
    });
    await user.click(screen.getByRole("button", { name: "BUY NOW" }));

    expect(navigate).toHaveBeenCalledWith("/checkout", {
      state: {
        checkoutItems: [{ id: 103, qty: 2 }],
        isBuyNow: true,
      },
    });
  });

  it("shows a loading placeholder and an empty state for relevant products", () => {
    vi.mocked(useRelevant).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as never);
    const { rerender } = renderProductDetail();

    expect(screen.getByTestId("relevant-skeleton")).toBeInTheDocument();
    expect(
      screen.queryByText("No relevant products found."),
    ).not.toBeInTheDocument();

    vi.mocked(useRelevant).mockReturnValue({
      data: { data: [] },
      isLoading: false,
    } as never);
    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false } },
          })
        }
      >
        <ProductDetail />
      </QueryClientProvider>,
    );

    expect(screen.queryByTestId("relevant-skeleton")).not.toBeInTheDocument();
    expect(screen.getByText("No relevant products found.")).toBeInTheDocument();
  });

  it("shows an out-of-stock state when every variant has no stock", () => {
    vi.mocked(useProductDetail).mockReturnValue({
      data: {
        data: {
          ...product2,
          variants: product2.variants.map((variant) => ({
            ...variant,
            Stock: 0,
          })),
        },
      },
      isSuccess: true,
    } as never);

    renderProductDetail();

    const outOfStockButtons = screen.getAllByRole("button", {
      name: "Out of stock",
    });
    expect(outOfStockButtons).toHaveLength(4);
    outOfStockButtons.forEach((button) => expect(button).toBeDisabled());
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "ADD TO CART" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("100.000 VND")).toBeInTheDocument();
  });
});
