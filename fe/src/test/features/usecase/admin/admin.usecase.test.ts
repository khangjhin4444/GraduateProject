import { describe, it, expect, vi, afterEach } from "vitest";
import { AdminUsecase } from "@/features/admin/usecase/admin.usecase"; // Adjust path if necessary
import { AdminService } from "@/features/admin/service/admin.service";

vi.mock("@/features/admin/service/admin.service", () => ({
  AdminService: {
    getProductDetail: vi.fn(),
    addProduct: vi.fn(),
    editProduct: vi.fn(),
    deleteProduct: vi.fn(),
    getAdminOrders: vi.fn(),
    adminCancelOrder: vi.fn(),
    adminProceedOrder: vi.fn(),
    adminDeliverOrder: vi.fn(),
  },
}));

describe("AdminUsecase", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getProductDetail", () => {
    it("should call AdminService.getProductDetail with correct parameters and return the result", async () => {
      const mockParams = { type: "keyboardkit", page: 1 };
      const mockResponse = { data: "mockProductDetail" };
      vi.mocked(AdminService.getProductDetail).mockResolvedValue(
        mockResponse as never,
      );

      const result = await AdminUsecase.getProductDetail(mockParams);

      expect(AdminService.getProductDetail).toHaveBeenCalledWith(mockParams);
      expect(AdminService.getProductDetail).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("addProduct", () => {
    it("should call AdminService.addProduct with formData", async () => {
      const mockFormData = new FormData();
      mockFormData.append("name", "Test Product");
      const mockResponse = { success: true };
      vi.mocked(AdminService.addProduct).mockResolvedValue(
        mockResponse as never,
      );

      const result = await AdminUsecase.addProduct(mockFormData);

      expect(AdminService.addProduct).toHaveBeenCalledWith(mockFormData);
      expect(AdminService.addProduct).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("editProduct", () => {
    it("should call AdminService.editProduct with productId and formData", async () => {
      const mockProductId = 101;
      const mockFormData = new FormData();
      mockFormData.append("price", "100");
      const mockResponse = { success: true };
      vi.mocked(AdminService.editProduct).mockResolvedValue(
        mockResponse as never,
      );

      const result = await AdminUsecase.editProduct(
        mockProductId,
        mockFormData,
      );

      expect(AdminService.editProduct).toHaveBeenCalledWith(
        mockProductId,
        mockFormData,
      );
      expect(AdminService.editProduct).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("deleteProduct", () => {
    it("should call AdminService.deleteProduct with variantId", async () => {
      const mockVariantId = 50;
      const mockResponse = { success: true };
      vi.mocked(AdminService.deleteProduct).mockResolvedValue(
        mockResponse as never,
      );

      const result = await AdminUsecase.deleteProduct(mockVariantId);

      expect(AdminService.deleteProduct).toHaveBeenCalledWith(mockVariantId);
      expect(AdminService.deleteProduct).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getAdminOrders", () => {
    it("should call AdminService.getAdminOrders with status and page", async () => {
      const mockParams = { status: "pending", page: 2 };
      const mockResponse = { orders: [] };
      vi.mocked(AdminService.getAdminOrders).mockResolvedValue(
        mockResponse as never,
      );

      const result = await AdminUsecase.getAdminOrders(mockParams);

      expect(AdminService.getAdminOrders).toHaveBeenCalledWith(mockParams);
      expect(AdminService.getAdminOrders).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("adminCancelOrder", () => {
    it("should call AdminService.adminCancelOrder with orderId", async () => {
      const mockOrderId = 1;
      const mockResponse = { success: true };
      vi.mocked(AdminService.adminCancelOrder).mockResolvedValue(
        mockResponse as never,
      );

      const result = await AdminUsecase.adminCancelOrder(mockOrderId);

      expect(AdminService.adminCancelOrder).toHaveBeenCalledWith(mockOrderId);
      expect(AdminService.adminCancelOrder).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("adminProceedOrder", () => {
    it("should call AdminService.adminProceedOrder with orderId", async () => {
      const mockOrderId = 2;
      const mockResponse = { success: true };
      vi.mocked(AdminService.adminProceedOrder).mockResolvedValue(
        mockResponse as never,
      );

      const result = await AdminUsecase.adminProceedOrder(mockOrderId);

      expect(AdminService.adminProceedOrder).toHaveBeenCalledWith(mockOrderId);
      expect(AdminService.adminProceedOrder).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("adminDeliverOrder", () => {
    it("should call AdminService.adminDeliverOrder with orderId", async () => {
      const mockOrderId = 3;
      const mockResponse = { success: true };
      vi.mocked(AdminService.adminDeliverOrder).mockResolvedValue(
        mockResponse as never,
      );

      const result = await AdminUsecase.adminDeliverOrder(mockOrderId);

      expect(AdminService.adminDeliverOrder).toHaveBeenCalledWith(mockOrderId);
      expect(AdminService.adminDeliverOrder).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });
});
