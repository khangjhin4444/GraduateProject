import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useAdminOrderAction } from "@/hooks/useAdminOrderAction";
import { AdminUsecase } from "@/features/admin/usecase/admin.usecase";
import type { OrderEntity } from "@/features/admin/schema/admin.schema";
import { AxiosError, AxiosHeaders } from "axios";
import { toast } from "sonner";
vi.mock("@/features/admin/usecase/admin.usecase", () => ({
  AdminUsecase: {
    adminCancelOrder: vi.fn(),
    adminProceedOrder: vi.fn(),
    adminDeliverOrder: vi.fn(),
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
  OrderID: 10,
  Address: "497",
  Date: "2026-10-11T15:53:00",
  Payment: "COD" as "COD" | "Banking",
  Shipping: "Fast" as "Fast" | "Normal",
  Phone: "1234567890",
  ReceiverName: "Khang",
  Request: null,
  Status: "Pending",
  Total: 2000000,
  UserID: 1,
  items: [
    {
      OrderItemID: 1,
      Color: "Black",
      MainImage: "/img.png",
      Name: "Haven75",
      Price: 1000000,
      ProductType: "KeyboardKit",
      Quantity: 1,
      SubType: "75%",
    },
    {
      OrderItemID: 2,
      Color: "Red",
      MainImage: "/img.png",
      Name: "Haven75",
      Price: 1000000,
      ProductType: "KeyboardKit",
      Quantity: 1,
      SubType: "75%",
    },
  ],
} as OrderEntity;

describe("useAdminOrderAction Hook", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.spyOn(queryClient, "invalidateQueries");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  describe("handleCancelOrder", () => {
    it("call AdminUsecase, toast.promise and invalidateQueries", async () => {
      vi.mocked(AdminUsecase.adminCancelOrder).mockResolvedValueOnce(
        {} as never,
      );

      const { result } = renderHook(() => useAdminOrderAction(mockOrder), {
        wrapper,
      });

      act(() => {
        result.current.handleCancelOrder(1);
      });

      expect(toast.promise).toHaveBeenCalledExactlyOnceWith(
        expect.any(Promise),
        {
          loading: "Canceling Order...",
          success: "Order Canceled",
        },
      );

      await waitFor(() => {
        expect(AdminUsecase.adminCancelOrder).toHaveBeenCalledWith(1);
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
          queryKey: ["admin-orders", mockOrder.Status],
        });
      });
    });

    it("show toast error with message from AxiosError on error", async () => {
      const axiosError = new AxiosError(
        "Request failed",
        undefined,
        undefined,
        undefined,
        {
          data: { message: "Order is in deliver" },
          status: 400,
          statusText: "Bad Request",
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
      );
      vi.mocked(AdminUsecase.adminCancelOrder).mockRejectedValueOnce(
        axiosError,
      );

      const { result } = renderHook(() => useAdminOrderAction(mockOrder), {
        wrapper,
      });

      act(() => {
        result.current.handleCancelOrder(1);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Order is in deliver");
      });
    });

    it("show toast error by default when error is not from Axios", async () => {
      const genericError = new Error("Some random error");
      vi.mocked(AdminUsecase.adminCancelOrder).mockRejectedValueOnce(
        genericError,
      );

      const { result } = renderHook(() => useAdminOrderAction(mockOrder), {
        wrapper,
      });

      act(() => {
        result.current.handleCancelOrder(1);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Error hapended when cancel order, try again later.",
        );
      });
    });
  });

  describe("handleProceedOrder", () => {
    it("call handleProceed", async () => {
      vi.mocked(AdminUsecase.adminProceedOrder).mockResolvedValueOnce(
        {} as never,
      );
      const { result } = renderHook(() => useAdminOrderAction(mockOrder), {
        wrapper,
      });

      act(() => {
        result.current.handleProceedOrder(2);
      });

      await waitFor(() => {
        expect(AdminUsecase.adminProceedOrder).toHaveBeenCalledWith(2);
        expect(toast.promise).toHaveBeenCalled();
        expect(queryClient.invalidateQueries).toHaveBeenCalled();
      });
    });
    it("show toast error with message from AxiosError on error", async () => {
      const axiosError = new AxiosError(
        "Request failed",
        undefined,
        undefined,
        undefined,
        {
          data: { message: "Order is in deliver" },
          status: 400,
          statusText: "Bad Request",
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
      );
      vi.mocked(AdminUsecase.adminProceedOrder).mockRejectedValueOnce(
        axiosError,
      );

      const { result } = renderHook(() => useAdminOrderAction(mockOrder), {
        wrapper,
      });

      act(() => {
        result.current.handleProceedOrder(1);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Order is in deliver");
      });
    });

    it("show toast error by default when error is not from Axios", async () => {
      const genericError = new Error("Some random error");
      vi.mocked(AdminUsecase.adminProceedOrder).mockRejectedValueOnce(
        genericError,
      );

      const { result } = renderHook(() => useAdminOrderAction(mockOrder), {
        wrapper,
      });

      act(() => {
        result.current.handleProceedOrder(1);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Error hapended when confirm order, try again later.",
        );
      });
    });
  });

  describe("handleDeliverOrder", () => {
    it("call handleDeliver", async () => {
      vi.mocked(AdminUsecase.adminDeliverOrder).mockResolvedValueOnce(
        {} as never,
      );
      const { result } = renderHook(() => useAdminOrderAction(mockOrder), {
        wrapper,
      });

      act(() => {
        result.current.handleDeliverOrder(3);
      });

      await waitFor(() => {
        expect(AdminUsecase.adminDeliverOrder).toHaveBeenCalledWith(3);
        expect(toast.promise).toHaveBeenCalled();
        expect(queryClient.invalidateQueries).toHaveBeenCalled();
      });
    });
    it("show toast error with message from AxiosError on error", async () => {
      const axiosError = new AxiosError(
        "Request failed",
        undefined,
        undefined,
        undefined,
        {
          data: { message: "Order is in deliver" },
          status: 400,
          statusText: "Bad Request",
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
      );
      vi.mocked(AdminUsecase.adminDeliverOrder).mockRejectedValueOnce(
        axiosError,
      );

      const { result } = renderHook(() => useAdminOrderAction(mockOrder), {
        wrapper,
      });

      act(() => {
        result.current.handleDeliverOrder(1);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Order is in deliver");
      });
    });

    it("show toast error by default when error is not from Axios", async () => {
      const genericError = new Error("Some random error");
      vi.mocked(AdminUsecase.adminDeliverOrder).mockRejectedValueOnce(
        genericError,
      );

      const { result } = renderHook(() => useAdminOrderAction(mockOrder), {
        wrapper,
      });

      act(() => {
        result.current.handleDeliverOrder(1);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Error hapended when set to delivered, try again later.",
        );
      });
    });
  });
});
