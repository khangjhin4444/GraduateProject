import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductUsecase } from "@/features/product/usecase/product.usecase";
import useSearchProducts, {
  useSearchProductsOption,
} from "@/hooks/useSearchProducts";

vi.mock("@/features/product/usecase/product.usecase", () => ({
  ProductUsecase: {
    getSearchProducts: vi.fn(),
  },
}));

function searchPage(page: number, hasNextPage: boolean) {
  return {
    success: true,
    page,
    limit: 10,
    totalPages: 4,
    hasNextPage,
    nextPage: hasNextPage ? page + 1 : null,
    products: [],
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useSearchProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads search results with the keyword, sort, and next page", async () => {
    const params = { keyword: "keyboard", page: 2, sort: "price-desc" };
    vi.mocked(ProductUsecase.getSearchProducts)
      .mockResolvedValueOnce(searchPage(2, true))
      .mockResolvedValueOnce(searchPage(3, false));
    const options = useSearchProductsOption(params);
    const { result } = renderHook(() => useSearchProducts(params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(options.queryKey).toEqual(["products", "keyboard", 2, "price-desc"]);
    expect(ProductUsecase.getSearchProducts).toHaveBeenNthCalledWith(1, {
      keyword: "keyboard",
      page: 2,
      sort: "price-desc",
    });
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });
    expect(ProductUsecase.getSearchProducts).toHaveBeenNthCalledWith(2, {
      keyword: "keyboard",
      page: 3,
      sort: "price-desc",
    });
    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2);
      expect(result.current.hasNextPage).toBe(false);
    });
  });
});
