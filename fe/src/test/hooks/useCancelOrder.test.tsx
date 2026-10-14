import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OrderUsecase } from "@/features/order/usecase/order.usecase";
import { useCancelOrder } from "@/hooks/useCancelOrder";
import type { OrderEntity } from "@/features/admin/schema/admin.schema";
import { toast } from "sonner";

vi.mock("@/features/order/usecase/order.usecase", () => ({
  OrderUsecase: {
    cancelOrder: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    promise: vi.fn((promise: Promise<unknown>) => {
      void promise.catch(() => undefined);
    }),
    error: vi.fn(),
  },
}));

const mockOrder = {
  Status: "Pending",
} as OrderEntity;

describe("useCancelOrder", () => {
  let queryClient: QueryClient;

  function createWrapper() {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.spyOn(queryClient, "invalidateQueries");
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("calls cancelOrder, triggers toast.promise, and invalidates queries on success", async () => {
    vi.mocked(OrderUsecase.cancelOrder).mockResolvedValue({
      success: true,
      message: "",
    });

    const { result } = renderHook(() => useCancelOrder(mockOrder), {
      wrapper: createWrapper(),
    });

    const orderIdToCancel = 123;

    act(() => {
      result.current.handleCancelOrder(orderIdToCancel);
    });

    // 1. Kiểm tra API được gọi đúng tham số
    await waitFor(() => {
      expect(OrderUsecase.cancelOrder).toHaveBeenCalledWith(orderIdToCancel);
    });

    // 2. Kiểm tra toast.promise được gọi với tham số Promise và config tương ứng
    expect(toast.promise).toHaveBeenCalledWith(expect.any(Promise), {
      loading: "Canceling Order...",
      success: "Order Canceled",
    });

    // 3. Kiểm tra onSettled gọi invalidateQueries với đúng Status
    await waitFor(() => {
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["orders", "Pending"],
      });
    });
  });

  it("shows Axios error message on onError callback", async () => {
    const error = new AxiosError(
      "Request failed with status 400",
      undefined,
      undefined,
      undefined,
    );
    vi.mocked(OrderUsecase.cancelOrder).mockRejectedValue(error);

    const { result } = renderHook(() => useCancelOrder(mockOrder), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleCancelOrder(123);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Request failed with status 400",
      );
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["orders", "Pending"],
    });
  });

  it("shows fallback error message for non-Axios errors", async () => {
    vi.mocked(OrderUsecase.cancelOrder).mockRejectedValue(
      new Error("Network disconnect"),
    );

    const { result } = renderHook(() => useCancelOrder(mockOrder), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleCancelOrder(123);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Error hapended when cancel order, try again later.",
      );
    });
  });
});
