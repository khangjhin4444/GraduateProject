import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNavigate } from "react-router";
import type { ProductEntity } from "@/features/product/schema/product.schema";
import useSearchProducts from "@/hooks/useSearchProducts";
import ProductSection from "@/pages/HasHeader/productByKeyword/_components/ProductSection";

vi.mock("@/hooks/useSearchProducts", () => ({ default: vi.fn() }));
vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useNavigate: vi.fn() };
});
vi.mock("@/shared/components/ProductSkeleton", () => ({
  default: () => <div data-testid="checkout-skeleton">Loading checkout</div>,
}));

const useSearchProductsMock = vi.mocked(useSearchProducts);
const navigate = vi.fn();

function createProduct(id: number, name: string): ProductEntity {
  return {
    ProductID: id,
    Name: name,
    ProductType: "Switch",
    Description: { blocks: [] },
    SubType: "Clicky",
    variants: [{ colorText: "Basic", image: "/switch.jpg", price: 100000 }],
  };
}

describe("Search ProductSection", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    useSearchProductsMock.mockReset();
    vi.mocked(useNavigate).mockReturnValue(navigate);
  });

  it("passes keyword, page, and sort into the search hook and paginates", () => {
    useSearchProductsMock.mockImplementation(
      ({ keyword, page, sort }) =>
        ({
          data: {
            pages: [
              {
                products: [createProduct(page, `${keyword} ${page}`)],
                hasNextPage: page === 1,
                nextPage: page === 1 ? 2 : null,
              },
            ],
          },
          isPending: false,
          isError: false,
          error: null,
          capturedSort: sort,
        }) as never,
    );

    render(<ProductSection keyword="blue switches" />);

    expect(
      screen.getByRole("img", { name: "blue switches 1" }),
    ).toHaveAttribute("src", "/switch.jpg");
    expect(screen.getByText("100.000 VND")).toBeInTheDocument();
    expect(useSearchProductsMock).toHaveBeenLastCalledWith({
      keyword: "blue switches",
      page: 1,
      sort: "default",
    });
    fireEvent.click(screen.getByText("Default"));
    fireEvent.click(screen.getByText("Price Increase"));
    expect(useSearchProductsMock).toHaveBeenLastCalledWith({
      keyword: "blue switches",
      page: 1,
      sort: "price-asc",
    });

    fireEvent.click(screen.getByText("blue switches 1"));
    expect(navigate).toHaveBeenCalledWith("/product/1");

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(
      screen.getByRole("img", { name: "blue switches 2" }),
    ).toBeInTheDocument();
    expect(useSearchProductsMock).toHaveBeenLastCalledWith({
      keyword: "blue switches",
      page: 2,
      sort: "price-asc",
    });
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(
      screen.getByRole("img", { name: "blue switches 1" }),
    ).toBeInTheDocument();
    expect(useSearchProductsMock).toHaveBeenLastCalledWith({
      keyword: "blue switches",
      page: 1,
      sort: "price-asc",
    });
  });

  it("shows the empty state when the search returns no products", () => {
    useSearchProductsMock.mockReturnValue({
      data: { pages: [{ products: [], hasNextPage: false, nextPage: null }] },
      isPending: false,
      isError: false,
      error: null,
    } as never);

    render(<ProductSection keyword="unavailable" />);

    expect(
      screen.getByText('No products found with keyword "unavailable"!'),
    ).toBeInTheDocument();
  });

  it("shows the loading state when search data has not loaded yet", () => {
    useSearchProductsMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      error: null,
    } as never);

    render(<ProductSection keyword="loading" />);

    expect(
      screen.getByRole("heading", { name: "Search Result" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('No products found with keyword "loading"!'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByTestId("checkout-skeleton")).toBeInTheDocument();
  });

  it("shows the error message when search fails with an Error", () => {
    useSearchProductsMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("Search unavailable"),
    } as never);

    render(<ProductSection keyword="failed search" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Search unavailable");
    expect(
      screen.queryByText('No products found with keyword "failed search"!'),
    ).not.toBeInTheDocument();
  });

  it("shows the fallback error message when search fails without an Error", () => {
    useSearchProductsMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: "request failed",
    } as never);

    render(<ProductSection keyword="failed search" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Cannot load Keyboard Kit products.",
    );
  });

  it("shows the empty state when search data contains no pages", () => {
    useSearchProductsMock.mockReturnValue({
      data: { pages: [] },
      isPending: false,
      isError: false,
      error: null,
    } as never);

    render(<ProductSection keyword="no pages" />);

    expect(
      screen.getByText('No products found with keyword "no pages"!'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Product pagination" }),
    ).not.toBeInTheDocument();
  });
});
