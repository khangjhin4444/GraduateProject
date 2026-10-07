import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminUsecase } from "@/features/admin/usecase/admin.usecase";
import useAdminOrders, { useAdminOrdersOptions } from "@/hooks/useOrderAdmin";

vi.mock("@/features/admin/usecase/admin.usecase", () => ({
  AdminUsecase: {
    getAdminOrders: vi.fn(),
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

describe("useAdminOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads admin order pages for the selected status", async () => {
    vi.mocked(AdminUsecase.getAdminOrders)
      .mockResolvedValueOnce(orderPage(1, true))
      .mockResolvedValueOnce(orderPage(2, false));
    const options = useAdminOrdersOptions("Pending");
    const { result } = renderHook(() => useAdminOrders("Pending"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(options.queryKey).toEqual(["admin-orders", "Pending"]);
    expect(AdminUsecase.getAdminOrders).toHaveBeenNthCalledWith(1, {
      status: "Pending",
      page: 1,
    });
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });
    expect(AdminUsecase.getAdminOrders).toHaveBeenNthCalledWith(2, {
      status: "Pending",
      page: 2,
    });
    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2);
      expect(result.current.hasNextPage).toBe(false);
    });
  });

  it("does not expose a next page when none is available", async () => {
    vi.mocked(AdminUsecase.getAdminOrders).mockResolvedValue(
      orderPage(1, false),
    );
    const { result } = renderHook(() => useAdminOrders("Delivered"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.data?.pages).toEqual([orderPage(1, false)]);
  });
});
