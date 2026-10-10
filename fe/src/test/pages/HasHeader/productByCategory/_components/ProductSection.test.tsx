import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useNavigate } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductEntity } from "@/features/product/schema/product.schema";
import useProducts from "@/hooks/useProducts";
import ProductSection from "@/pages/HasHeader/productByCategory/_components/ProductSection";

vi.mock("@/hooks/useProducts", () => ({ default: vi.fn() }));
vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useNavigate: vi.fn() };
});
vi.mock("@/shared/components/ProductSkeleton", () => ({
  default: () => <div data-testid="checkout-skeleton">Loading checkout</div>,
}));
const useProductsMock = vi.mocked(useProducts);
const navigate = vi.fn();

function createProduct(id: number, name: string): ProductEntity {
  return {
    ProductID: id,
    Name: name,
    ProductType: "KeyboardKit",
    Description: { blocks: [] },
    SubType: "75%",
    variants: [
      { colorText: "Black", image: "/black.jpg", price: 750000 },
      { colorText: "White", image: "/white.jpg", price: 725000 },
    ],
  };
}

describe("Category ProductSection", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    useProductsMock.mockReset();
    navigate.mockReset();
    vi.mocked(useNavigate).mockReturnValue(navigate);
  });
  it("show skeleton on pending", async () => {
    useProductsMock.mockReturnValue({
      data: {
        pages: [
          {
            data: [createProduct(1, "75% Keyboard")],
            hasNextPage: false,
            nextPage: null,
          },
        ],
      },
      isPending: true,
      isError: false,
      error: null,
    } as never);

    render(<ProductSection type="keyboardkit" sub="75%" />);
    expect(screen.getByTestId("checkout-skeleton")).toBeInTheDocument();
  });

  it("formats category filters for the hook and shows returned products", async () => {
    useProductsMock.mockReturnValue({
      data: {
        pages: [
          {
            data: [createProduct(1, "75% Keyboard")],
            hasNextPage: false,
            nextPage: null,
          },
        ],
      },
      isPending: false,
      isError: false,
      error: null,
    } as never);

    render(<ProductSection type="keyboardkit" sub="75%" />);

    expect(
      screen.getByRole("heading", { name: /Keyboard Kit.*75%/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "75% Keyboard" })).toHaveAttribute(
      "src",
      "/black.jpg",
    );
    expect(screen.getByText("750.000 VND")).toBeInTheDocument();
    expect(useProductsMock).toHaveBeenCalledWith({
      type: "KeyboardKit",
      sub: "75%",
      sort: "default",
      page: 1,
      limit: 8,
    });
    await userEvent.click(screen.getByRole("button", { name: "View More" }));
    expect(navigate).toHaveBeenCalledWith("/product/1");
  });

  it("shows an error and hides products when the query fails", () => {
    useProductsMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("Products unavailable"),
    } as never);

    render(<ProductSection type="keycap" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Products unavailable");
    expect(screen.queryByRole("button", { name: "Next page" })).toBeNull();
  });
  it("shows default error when error is not instance of Error", () => {
    useProductsMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: "error",
    } as never);

    render(<ProductSection type="keycap" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Cannot load Keyboard Kit products.",
    );
    expect(screen.queryByRole("button", { name: "Next page" })).toBeNull();
  });

  it("resets to page one when sort order changes", async () => {
    const user = userEvent.setup();
    useProductsMock.mockImplementation(
      ({ page }) =>
        ({
          data: {
            pages: [
              {
                data: [createProduct(page, `Product ${page}`)],
                hasNextPage: page === 1,
                nextPage: page === 1 ? 2 : null,
              },
            ],
          },
          isPending: false,
          isError: false,
          error: null,
        }) as never,
    );

    render(<ProductSection type="keycap" />);
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("Product 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("Product 2")).toBeInTheDocument();

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "A - Z" }));

    expect(await screen.findByText("Product 1")).toBeInTheDocument();
    expect(useProductsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, sort: "name-asc" }),
    );
  });
  it("shows the empty state when returns no products", () => {
    useProductsMock.mockImplementation(
      ({ page }) =>
        ({
          data: {
            pages: [
              {
                data: [],
                hasNextPage: page === 1,
                nextPage: page === 1 ? 2 : null,
              },
            ],
          },
          isPending: false,
          isError: false,
          error: null,
        }) as never,
    );

    render(<ProductSection type="keyboardkit" sub="75%" />);

    expect(screen.getByText("No products found!")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Explore/ }));
    expect(navigate).toHaveBeenCalledWith("/collection/keyboardkit");
  });
});
