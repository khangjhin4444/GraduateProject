import { describe, it, expect, vi, afterEach } from "vitest";
import { OrderUsecase } from "@/features/order/usecase/order.usecase"; // Adjust path if necessary
import { OrderService } from "@/features/order/service/order.service";

vi.mock("@/features/order/service/order.service", () => ({
  OrderService: {
    getOrders: vi.fn(),
    prepareOrder: vi.fn(),
    placeOrder: vi.fn(),
    cancelOrder: vi.fn(),
  },
}));

describe("CartUsecase", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrders", () => {
    it("should call OrderService.getOrders with correct parameters and return the result", async () => {
      const mockPayload = { status: "Pending", page: 1 };
      const mockResponse = { success: true };
      vi.mocked(OrderService.getOrders).mockResolvedValue(
        mockResponse as never,
      );

      const result = await OrderUsecase.getOrders(mockPayload);

      expect(OrderService.getOrders).toHaveBeenCalledWith(mockPayload);
      expect(OrderService.getOrders).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("prepareOrder", () => {
    it("should call OrderService.prepareOrder with correct parameters", async () => {
      const mockPayload = [
        { id: 4, qty: 4 },
        { id: 5, qty: 5 },
      ];
      const mockResponse = { success: true };
      vi.mocked(OrderService.prepareOrder).mockResolvedValue(
        mockResponse as never,
      );

      const result = await OrderUsecase.prepareOrder(mockPayload);

      expect(OrderService.prepareOrder).toHaveBeenCalledWith(mockPayload);
      expect(OrderService.prepareOrder).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });
  describe("placeOrder", () => {
    it("should call OrderService.placeOrder with correct payload from checkout page", async () => {
      const mockPayload = {
        name: "khang",
        phone: "1234567890",
        address: "497",
        request: undefined,
        shipping: "Fast" as "Fast" | "Normal",
        payment: "COD" as "COD" | "Banking",
        save: false,
        variantIds: [4, 5, 6],
      };
      const mockResponse = { success: true };
      vi.mocked(OrderService.placeOrder).mockResolvedValue(
        mockResponse as never,
      );

      const result = await OrderUsecase.placeOrder(mockPayload);

      expect(OrderService.placeOrder).toHaveBeenCalledWith(mockPayload);
      expect(OrderService.placeOrder).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
    it("should call OrderService.placeOrder with correct payload by pressing buy now", async () => {
      const mockPayload = {
        name: "khang",
        phone: "1234567890",
        address: "497",
        request: undefined,
        shipping: "Fast" as "Fast" | "Normal",
        payment: "COD" as "COD" | "Banking",
        save: false,
        buyNow: {
          id: 5,
          qty: 10,
        },
      };
      const mockResponse = { success: true };
      vi.mocked(OrderService.placeOrder).mockResolvedValue(
        mockResponse as never,
      );

      const result = await OrderUsecase.placeOrder(mockPayload);

      expect(OrderService.placeOrder).toHaveBeenCalledWith(mockPayload);
      expect(OrderService.placeOrder).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });
  describe("cancelOrder", () => {
    it("should call OrderService.cancelOrder with correct payload", async () => {
      const mockPayload = { orderId: 5 };
      const mockResponse = { success: true };
      vi.mocked(OrderService.cancelOrder).mockResolvedValue(
        mockResponse as never,
      );

      const result = await OrderUsecase.cancelOrder(mockPayload.orderId);

      expect(OrderService.cancelOrder).toHaveBeenCalledWith(
        mockPayload.orderId,
      );
      expect(OrderService.cancelOrder).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });
});
