import { afterEach, describe, expect, it, vi } from "vitest";
import { privateApi } from "@/api/axios.instance";
import { AdminService } from "@/features/admin/service/admin.service";

describe("AdminService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("gets product details by type and page with response validation", async () => {
    const data = {
      success: true,
      page: 1,
      limit: 10,
      hasNextPage: false,
      nextPage: null,
      data: [],
    };
    const request = vi.spyOn(privateApi, "request").mockResolvedValue({ data });

    await expect(
      AdminService.getProductDetail({ type: "KeyboardKit", page: 1 }),
    ).resolves.toEqual(data);

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: "api/products/admin",
        params: { type: "KeyboardKit", page: 1 },
      }),
    );
  });

  it("adds a product with multipart upload configuration", async () => {
    const formData = new FormData();
    const data = { success: true, message: "Product added" };
    const request = vi.spyOn(privateApi, "request").mockResolvedValue({ data });

    await expect(AdminService.addProduct(formData)).resolves.toEqual(data);

    expect(request).toHaveBeenCalledWith({
      method: "POST",
      url: "/api/products/admin/new",
      headers: { "Content-Type": "multipart/form-data" },
      data: formData,
      timeout: 120000,
    });
  });

  it("edits a product by ID with multipart upload configuration", async () => {
    const formData = new FormData();
    const data = { success: true, message: "Product edited" };
    const request = vi
      .spyOn(privateApi, "request")
      .mockResolvedValue({ data } as never);

    await expect(AdminService.editProduct(25, formData)).resolves.toEqual(data);

    expect(request).toHaveBeenCalledWith({
      method: "PUT",
      url: "/api/products/admin/edit/25",
      headers: { "Content-Type": "multipart/form-data" },
      data: formData,
      timeout: 120000,
    });
  });

  it("deletes a product variant with response validation", async () => {
    const data = { success: true, message: "Variant deleted" };
    const request = vi.spyOn(privateApi, "request").mockResolvedValue({ data });

    await expect(AdminService.deleteProduct(17)).resolves.toEqual(data);

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "DELETE",
        url: "/api/products/admin/17",
        responseSchema: expect.anything(),
      }),
    );
  });

  it("gets admin orders by status and page with response validation", async () => {
    const data = {
      success: true,
      page: 1,
      limit: 10,
      hasNextPage: false,
      nextPage: null,
      length: 0,
      data: [],
    };
    const request = vi.spyOn(privateApi, "request").mockResolvedValue({ data });

    await expect(
      AdminService.getAdminOrders({ status: "pending", page: 1 }),
    ).resolves.toEqual(data);

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: "/api/orders/admin",
        params: { status: "pending", page: 1 },
        responseSchema: expect.anything(),
      }),
    );
  });

  it.each([
    ["cancel", AdminService.adminCancelOrder, "/api/orders/admin/cancel"],
    ["proceed", AdminService.adminProceedOrder, "/api/orders/admin/proceed"],
    ["deliver", AdminService.adminDeliverOrder, "/api/orders/admin/deliver"],
  ] as const)(
    "%s an order with the expected endpoint and response schema",
    async (_, action, url) => {
      const data = { success: true, message: "Order updated" };
      const request = vi
        .spyOn(privateApi, "request")
        .mockResolvedValue({ data });

      await expect(action(55)).resolves.toEqual(data);

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "PUT",
          url,
          data: { orderID: 55 },
          responseSchema: expect.anything(),
        }),
      );
    },
  );
});
