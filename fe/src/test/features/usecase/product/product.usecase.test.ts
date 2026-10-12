import { describe, it, expect, vi, afterEach } from "vitest";
import { ProductUsecase } from "@/features/product/usecase/product.usecase"; // Adjust path if necessary
import { ProductService } from "@/features/product/service/product.service";

vi.mock("@/features/product/service/product.service", () => ({
  ProductService: {
    getProductById: vi.fn(),
    getProducts: vi.fn(),
    getSearchProducts: vi.fn(),
    getRelevantProducts: vi.fn(),
  },
}));

describe("ProductUsecase", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getProductById", () => {
    it("should call ProductService.getProductById with correct parameters and return the result", async () => {
      const mockPayload = { id: 4 };
      const mockResponse = { success: true };
      vi.mocked(ProductService.getProductById).mockResolvedValue(
        mockResponse as never,
      );

      const result = await ProductUsecase.getProductDetail(mockPayload.id);

      expect(ProductService.getProductById).toHaveBeenCalledWith(
        mockPayload.id,
      );
      expect(ProductService.getProductById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getProducts", () => {
    it("should call ProductService.getProducts with correct parameters", async () => {
      const mockPayload = {
        type: "KeyboardKit",
        page: 1,
        sort: "price-asc",
        sub: "TKL",
      };
      const mockResponse = { success: true };
      vi.mocked(ProductService.getProducts).mockResolvedValue(
        mockResponse as never,
      );

      const result = await ProductUsecase.getProducts(mockPayload);

      expect(ProductService.getProducts).toHaveBeenCalledWith({
        ...mockPayload,
        limit: 20,
      });
      expect(ProductService.getProducts).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });
  describe("getSearchProducts", () => {
    it("should call ProductService.getSearchProducts with correct parameters", async () => {
      const mockPayload = { keyword: "GMK", page: 1, sort: "default" };
      const mockResponse = { success: true };
      vi.mocked(ProductService.getSearchProducts).mockResolvedValue(
        mockResponse as never,
      );

      const result = await ProductUsecase.getSearchProducts(mockPayload);

      expect(ProductService.getSearchProducts).toHaveBeenCalledWith(
        mockPayload,
      );
      expect(ProductService.getSearchProducts).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });
  describe("getRelevantProducts", () => {
    it("should call ProductService.getRelevantProducts with correct payload", async () => {
      const mockPayload = { type: "KeyboardKit", id: 5 };
      const mockResponse = { success: true };
      vi.mocked(ProductService.getRelevantProducts).mockResolvedValue(
        mockResponse as never,
      );

      const result = await ProductUsecase.getRelevantProducts(mockPayload);

      expect(ProductService.getRelevantProducts).toHaveBeenCalledWith(
        mockPayload,
      );
      expect(ProductService.getRelevantProducts).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });
});
