import { afterEach, describe, expect, it, vi } from "vitest";
import { privateApi } from "@/api/axios.instance";
import { CartService } from "@/features/cart/service/cart.service";

describe("CartService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds an item using the API field names", async () => {
    const data = { success: true, message: "Added", newQuantity: 2 };
    const request = vi.spyOn(privateApi, "request").mockResolvedValue({ data });

    await expect(
      CartService.addToCart({ variantId: 42, quantity: 2 }),
    ).resolves.toEqual(data);

    expect(request).toHaveBeenCalledWith({
      method: "POST",
      url: "/api/cart/add",
      data: { VariantID: 42, Quantity: 2 },
    });
  });

  it("gets the cart with response validation", async () => {
    const data = {
      success: true,
      message: "Cart loaded",
      warnings: 0,
      cartQuantity: 0,
      items: [],
    };
    const request = vi.spyOn(privateApi, "request").mockResolvedValue({ data });

    await expect(CartService.getCart()).resolves.toEqual(data);

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: "/api/cart",
      }),
    );
  });

  it("changes item quantity with response validation", async () => {
    const data = { success: true, message: "Quantity changed" };
    const request = vi.spyOn(privateApi, "request").mockResolvedValue({ data });

    await expect(
      CartService.changeItemQuantity({ variantId: 42, quantity: 3 }),
    ).resolves.toEqual(data);

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "PUT",
        url: "/api/cart/change",
        data: { VariantID: 42, Quantity: 3 },
      }),
    );
  });

  it("deletes one cart item with response validation", async () => {
    const data = { success: true, message: "Item deleted" };
    const request = vi.spyOn(privateApi, "request").mockResolvedValue({ data });

    await expect(
      CartService.deleteCartItem({ variantId: 42 }),
    ).resolves.toEqual(data);

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "DELETE",
        url: "/api/cart/delete",
        data: { VariantID: 42 },
      }),
    );
  });
});
