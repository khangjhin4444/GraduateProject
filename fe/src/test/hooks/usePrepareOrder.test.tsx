import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderUsecase } from "@/features/order/usecase/order.usecase";
import { usePrepareOrder } from "@/hooks/usePrepareOrder";

vi.mock("@/features/order/usecase/order.usecase", () => ({
  OrderUsecase: {
    prepareOrder: vi.fn(),
  },
}));

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

describe("usePrepareOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not request an order preview for an empty selection", () => {
    const { result } = renderHook(() => usePrepareOrder([]), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(OrderUsecase.prepareOrder).not.toHaveBeenCalled();
  });

  it("requests an order preview for selected variants", async () => {
    const payload = [{ id: 17, qty: 2 }];
    const response = {
      success: true,
      message: "Prepared",
      warnings: 0,
      totalQuantity: 2,
      subTotal: 2000,
      items: [],
    };
    vi.mocked(OrderUsecase.prepareOrder).mockResolvedValue(response);

    const { result } = renderHook(() => usePrepareOrder(payload), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(OrderUsecase.prepareOrder).toHaveBeenCalledWith(payload);
    expect(result.current.data).toEqual(response);
  });
});
