import { afterEach, describe, expect, it, vi } from "vitest";
import { privateApi } from "@/api/axios.instance";
import {
  OrderService,
  type PlaceOrderProps,
} from "@/features/order/service/order.service";

describe("OrderService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("gets orders by status and page with response validation", async () => {
    const data = {
      success: true,
      page: 2,
      limit: 10,
      hasNextPage: false,
      nextPage: null,
      length: 0,
      data: [],
    };
    const request = vi.spyOn(privateApi, "request").mockResolvedValue({ data });

    await expect(
      OrderService.getOrders({ status: "pending", page: 2 }),
    ).resolves.toEqual(data);

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: "/api/orders",
        params: { status: "pending", page: 2 },
      }),
    );
  });

  it("prepares an order with items wrapped in the request body", async () => {
    const payload = [
      { id: 12, qty: 2 },
      { id: 30, qty: 1 },
    ];
    const data = {
      success: true,
      message: "Order prepared",
      warnings: 0,
      totalQuantity: 3,
      subTotal: 150,
      items: [],
    };
    const request = vi.spyOn(privateApi, "request").mockResolvedValue({ data });

    await expect(OrderService.prepareOrder(payload)).resolves.toEqual(data);

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: "/api/orders/prepare",
        data: { items: payload },
      }),
    );
  });

  it("places an order with checkout fields and response validation", async () => {
    const payload = {
      name: "Keyboard User",
      phone: "123456789",
      address: "Keyboard Street",
      shipping: "Normal",
      payment: "COD",
      request: "",
      save: true,
      variantIds: [12, 30],
    } satisfies PlaceOrderProps;
    const data = { success: true, message: "Order placed", orderId: 99 };
    const request = vi.spyOn(privateApi, "request").mockResolvedValue({ data });

    await expect(OrderService.placeOrder(payload)).resolves.toEqual(data);

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: "/api/cart/checkout",
        data: payload,
      }),
    );
  });

  it("cancels an order using the API orderID field", async () => {
    const data = { success: true, message: "Order cancelled" };
    const request = vi.spyOn(privateApi, "request").mockResolvedValue({ data });

    await expect(OrderService.cancelOrder(99)).resolves.toEqual(data);

    expect(request).toHaveBeenCalledWith({
      method: "PUT",
      url: "/api/orders/cancel",
      data: { orderID: 99 },
    });
  });
});
