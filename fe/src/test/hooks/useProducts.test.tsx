import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductUsecase } from "@/features/product/usecase/product.usecase";
import useProducts, { useProductsOption } from "@/hooks/useProducts";

vi.mock("@/features/product/usecase/product.usecase", () => ({
  ProductUsecase: {
    getProducts: vi.fn(),
  },
}));

function productPage(page: number, hasNextPage: boolean) {
  return {
    success: true,
    page,
    limit: 12,
    hasNextPage,
    nextPage: hasNextPage ? page + 1 : null,
    data: [],
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

describe("useProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads product pages with the supplied filters and pagination", async () => {
    const params = {
      type: "KeyboardKit",
      page: 3,
      limit: 12,
      sort: "price-asc",
      sub: "75%",
      enable: true,
    };
    vi.mocked(ProductUsecase.getProducts)
      .mockResolvedValueOnce(productPage(3, true))
      .mockResolvedValueOnce(productPage(4, false));
    const options = useProductsOption(params);
    const { result } = renderHook(() => useProducts(params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(options.queryKey).toEqual([
      "products",
      "KeyboardKit",
      "75%",
      "price-asc",
      3,
    ]);
    expect(ProductUsecase.getProducts).toHaveBeenNthCalledWith(1, {
      type: "KeyboardKit",
      page: 3,
      limit: 12,
      sort: "price-asc",
      sub: "75%",
    });
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });
    expect(ProductUsecase.getProducts).toHaveBeenNthCalledWith(2, {
      type: "KeyboardKit",
      page: 4,
      limit: 12,
      sort: "price-asc",
      sub: "75%",
    });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
  });

  it("does not fetch when disabled", () => {
    const { result } = renderHook(
      () => useProducts({ type: "KeyboardKit", page: 1, enable: false }),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(ProductUsecase.getProducts).not.toHaveBeenCalled();
  });
});
