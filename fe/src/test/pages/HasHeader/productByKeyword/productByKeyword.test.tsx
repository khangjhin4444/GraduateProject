import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLoaderData, useNavigate } from "react-router";
import useSearchProducts from "@/hooks/useSearchProducts";
import Page from "@/pages/HasHeader/productByKeyword";

vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");

  return {
    ...actual,
    useLoaderData: vi.fn(),
    useNavigate: vi.fn(),
  };
});

vi.mock("@/hooks/useSearchProducts", () => ({
  default: vi.fn(),
}));

const useLoaderDataMock = vi.mocked(useLoaderData);
const useSearchProductsMock = vi.mocked(useSearchProducts);
const navigate = vi.fn();

function createPage(name: string, page: number) {
  return {
    products: [
      {
        ProductID: page,
        Name: `${name}-${page}`,
        ProductType: "keyboardkit",
        Description: "",
        SubType: "75%",
        variants: [
          { colorText: "Black", image: "/black.jpg", price: 100000 },
          { colorText: "White", image: "/white.jpg", price: 125000 },
        ],
      },
    ],
    hasNextPage: page === 1,
    nextPage: page === 1 ? 2 : null,
  };
}

describe("search page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLoaderDataMock.mockReturnValue({ keyword: "first" });
    vi.mocked(useNavigate).mockReturnValue(navigate);
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
    expect(screen.getByRole("img", { name: "first-2" })).toBeInTheDocument();

    useLoaderDataMock.mockReturnValue({ keyword: "second" });
    view.rerender(<Page />);

    expect(screen.getByRole("img", { name: "second-1" })).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "second-2" }),
    ).not.toBeInTheDocument();
  });
});
