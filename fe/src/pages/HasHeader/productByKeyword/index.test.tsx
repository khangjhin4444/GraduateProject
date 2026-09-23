import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLoaderData } from "react-router";
import useSearchProducts from "@/hooks/useSearchProducts";
import Page from "./index";

vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");

  return {
    ...actual,
    useLoaderData: vi.fn(),
  };
});

vi.mock("@/hooks/useSearchProducts", () => ({
  default: vi.fn(),
}));

vi.mock("@/shared/components/ProductCard", () => ({
  ProductCard: ({ product }: { product: { Name: string } }) => (
    <div>{product.Name}</div>
  ),
}));

const useLoaderDataMock = vi.mocked(useLoaderData);
const useSearchProductsMock = vi.mocked(useSearchProducts);

function createPage(name: string, page: number) {
  return {
    products: [
      {
        ProductID: page,
        Name: `${name}-${page}`,
        ProductType: "keyboardkit",
        Description: "",
        SubType: "75%",
        MainImage: "image.jpg",
        Price: "100",
        variants: null,
      },
    ],
    hasNextPage: page === 1,
    nextPage: page === 1 ? 2 : null,
  };
}

describe("search page", () => {
  beforeEach(() => {
    useLoaderDataMock.mockReturnValue({ keyword: "first" });
    useSearchProductsMock.mockImplementation(
      ({ keyword, page }) =>
        ({
          data: { pages: [createPage(keyword, page)] },
          isPending: false,
          isError: false,
          error: null,
        }) as never,
    );
  });

  it("resets to page one when the keyword changes", () => {
    const view = render(<Page />);

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("first-2")).toBeInTheDocument();

    useLoaderDataMock.mockReturnValue({ keyword: "second" });
    view.rerender(<Page />);

    expect(screen.getByText("second-1")).toBeInTheDocument();
    expect(screen.queryByText("second-2")).not.toBeInTheDocument();
  });
});
