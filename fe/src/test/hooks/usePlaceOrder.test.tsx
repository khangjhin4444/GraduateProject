import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OrderUsecase } from "@/features/order/usecase/order.usecase";
import { usePlaceOrder } from "@/hooks/usePlaceOrder";
import { toast } from "sonner";
import { useNavigate, type NavigateFunction } from "react-router";

vi.mock("@/features/order/usecase/order.usecase", () => ({
  OrderUsecase: {
    placeOrder: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    loading: vi.fn(() => "toast-id"),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("react-router", () => ({
  useNavigate: vi.fn(),
}));

const payload = {
  name: "Keyboard Buyer",
  phone: "0123456789",
  address: "123 Keyboard Street",
  request: "Call on arrival",
  shipping: "Normal" as const,
  payment: "COD" as const,
  save: true,
  variantIds: [17, 18],
};

describe("usePlaceOrder", () => {
  let queryClient: QueryClient;
  let navigate: NavigateFunction;

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
    navigate = vi.fn(() => undefined);
    vi.mocked(useNavigate).mockReturnValue(navigate);
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("places an order, notifies the user, invalidates queries, and navigates", async () => {
    const response = {
      success: true,
      message: "Order placed",
      orderId: 501,
    };
    vi.mocked(OrderUsecase.placeOrder).mockResolvedValue(response);

    const { result } = renderHook(() => usePlaceOrder(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.placeOrderMutation.mutate(payload);
    });

    await waitFor(() =>
      expect(result.current.placeOrderMutation.isSuccess).toBe(true),
    );

    expect(OrderUsecase.placeOrder).toHaveBeenCalledWith(payload);
    expect(toast.loading).toHaveBeenCalledWith("Placing Order...");
    expect(toast.success).toHaveBeenCalledWith("Order Placed!", {
      id: "toast-id",
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["orders", "Pending"],
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["cart"],
    });
    expect(navigate).toHaveBeenCalledWith("/order", { replace: true });
  });

  it("shows the server message on an Axios error and invalidates the cart", async () => {
    const error = new AxiosError("Request failed", undefined, undefined, undefined, {
      data: { message: "Out of stock" },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    vi.mocked(OrderUsecase.placeOrder).mockRejectedValue(error);

    const { result } = renderHook(() => usePlaceOrder(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.placeOrderMutation.mutate(payload);
    });

    await waitFor(() =>
      expect(result.current.placeOrderMutation.isError).toBe(true),
    );

    expect(toast.error).toHaveBeenCalledWith("Out of stock", {
      id: "toast-id",
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledExactlyOnceWith({
      queryKey: ["cart"],
    });
    expect(navigate).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("shows the error message when the failure is not an Axios response", async () => {
    vi.mocked(OrderUsecase.placeOrder).mockRejectedValue(
      new Error("Network unavailable"),
    );

    const { result } = renderHook(() => usePlaceOrder(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.placeOrderMutation.mutate(payload);
    });

    await waitFor(() =>
      expect(result.current.placeOrderMutation.isError).toBe(true),
    );

    expect(toast.error).toHaveBeenCalledWith("Network unavailable", {
      id: "toast-id",
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledExactlyOnceWith({
      queryKey: ["cart"],
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("falls back to the Axios error message when the response has no message", async () => {
    const error = new AxiosError(
      "Request failed",
      undefined,
      undefined,
      undefined,
      {
        data: {},
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
    );
    vi.mocked(OrderUsecase.placeOrder).mockRejectedValue(error);

    const { result } = renderHook(() => usePlaceOrder(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.placeOrderMutation.mutate(payload);
    });

    await waitFor(() =>
      expect(result.current.placeOrderMutation.isError).toBe(true),
    );

    expect(toast.error).toHaveBeenCalledWith("Request failed", {
      id: "toast-id",
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledExactlyOnceWith({
      queryKey: ["cart"],
    });
  });
});
