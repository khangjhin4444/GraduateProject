import { describe, it, expect, vi, afterEach } from "vitest";
import { CartUsecase } from "@/features/cart/usecase/cart.usecase"; // Adjust path if necessary
import { CartService } from "@/features/cart/service/cart.service";

vi.mock("@/features/cart/service/cart.service", () => ({
  CartService: {
    addToCart: vi.fn(),
    getCart: vi.fn(),
    changeItemQuantity: vi.fn(),
    deleteCartItem: vi.fn(),
  },
}));

describe("CartUsecase", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("addToCart", () => {
    it("should call CartService.addToCart with correct parameters and return the result", async () => {
      const mockPayload = { variantId: 5, quantity: 10 };
      const mockResponse = { success: true, message: "added to cart" };
      vi.mocked(CartService.addToCart).mockResolvedValue(mockResponse as never);

      const result = await CartUsecase.addToCart(mockPayload);

      expect(CartService.addToCart).toHaveBeenCalledWith(mockPayload);
      expect(CartService.addToCart).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getCart", () => {
    it("should call CartService.getCart", async () => {
      const mockResponse = { success: true };
      vi.mocked(CartService.getCart).mockResolvedValue(mockResponse as never);

      const result = await CartUsecase.getCart();

      expect(CartService.getCart).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });
  describe("changeItemQuantity", () => {
    it("should call CartService.changeItemQuantity with correct payload", async () => {
      const mockPayload = { variantId: 5, quantity: 10 };
      const mockResponse = { success: true };
      vi.mocked(CartService.changeItemQuantity).mockResolvedValue(
        mockResponse as never,
      );

      const result = await CartUsecase.changeItemQuantity(mockPayload);

      expect(CartService.changeItemQuantity).toHaveBeenCalledWith(mockPayload);
      expect(CartService.changeItemQuantity).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });
  describe("deleteCartItem", () => {
    it("should call CartService.deleteCartItem with correct payload", async () => {
      const mockPayload = { variantId: 5 };
      const mockResponse = { success: true };
      vi.mocked(CartService.deleteCartItem).mockResolvedValue(
        mockResponse as never,
      );

      const result = await CartUsecase.deleteCartItem(mockPayload);

      expect(CartService.deleteCartItem).toHaveBeenCalledWith(mockPayload);
      expect(CartService.deleteCartItem).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });
});
