import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderUsecase } from "@/features/order/usecase/order.usecase";
import useOrders, { useOrdersOptions } from "@/hooks/useOrders";

vi.mock("@/features/order/usecase/order.usecase", () => ({
  OrderUsecase: {
    getOrders: vi.fn(),
  },
}));

function orderPage(page: number, hasNextPage: boolean) {
  return {
    success: true,
    page,
    limit: 10,
    hasNextPage,
    nextPage: hasNextPage ? page + 1 : null,
    length: 0,
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

describe("useOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads pages using the selected status and next-page metadata", async () => {
    vi.mocked(OrderUsecase.getOrders)
      .mockResolvedValueOnce(orderPage(1, true))
      .mockResolvedValueOnce(orderPage(2, false));
    const options = useOrdersOptions("Pending");
    const { result } = renderHook(() => useOrders("Pending"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(options.queryKey).toEqual(["orders", "Pending"]);
    expect(OrderUsecase.getOrders).toHaveBeenNthCalledWith(1, {
      status: "Pending",
      page: 1,
    });
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });
    expect(OrderUsecase.getOrders).toHaveBeenNthCalledWith(2, {
      status: "Pending",
      page: 2,
    });
    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2);
      expect(result.current.hasNextPage).toBe(false);
    });
  });

  it("does not expose a next page when the first page is terminal", async () => {
    vi.mocked(OrderUsecase.getOrders).mockResolvedValue(orderPage(1, false));
    const { result } = renderHook(() => useOrders("Delivered"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.data?.pages).toEqual([orderPage(1, false)]);
  });
});
