import { describe, expect, it, vi } from "vitest";
import { afterEach } from "vitest";
import { privateApi, publicApi } from "@/api/axios.instance";
import { ProductService } from "@/features/product/service/product.service";

describe("ProductService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("gets product details by ID with response validation", async () => {
    const data = { success: true, data: { ProductID: 5 } };
    const request = vi.spyOn(privateApi, "request").mockResolvedValue({ data });

    await expect(ProductService.getProductById(5)).resolves.toEqual(data);

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: "/api/products/5",
      }),
    );
  });

  it("gets products using defaults for optional filters", async () => {
    const data = {
      success: true,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNextPage: false,
      nextPage: null,
      data: [],
    };
    const request = vi.spyOn(publicApi, "request").mockResolvedValue({ data });

    await expect(
      ProductService.getProducts({ type: "Keyboard Kit", page: 1 }),
    ).resolves.toEqual(data);

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: "/api/products?type=Keyboard Kit&page=1&limit=20&sort=default&sub=undefined",
      }),
    );
  });

  it("passes supplied product listing filters", async () => {
    const request = vi
      .spyOn(publicApi, "request")
      .mockResolvedValue({ data: {} });

    await ProductService.getProducts({
      type: "KeyboardKit",
      page: 3,
      limit: 12,
      sort: "price-asc",
      sub: "75%",
    });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/products?type=KeyboardKit&page=3&limit=12&sort=price-asc&sub=75%",
      }),
    );
  });

  it("searches products with keyword params and response validation", async () => {
    const data = {
      success: true,
      page: 2,
      limit: 20,
      totalPages: 2,
      hasNextPage: false,
      nextPage: null,
      products: [],
    };
    const request = vi.spyOn(publicApi, "request").mockResolvedValue({ data });

    await expect(
      ProductService.getSearchProducts({
        keyword: "red&blue 100%",
        page: 2,
        sort: "name-asc",
      }),
    ).resolves.toEqual(data);

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: "/api/products/search",
        params: {
          keyword: "red&blue 100%",
          page: 2,
          sort: "name-asc",
        },
      }),
    );
  });

  it("passes special keywords as Axios params without changing them", async () => {
    const request = vi
      .spyOn(publicApi, "request")
      .mockResolvedValue({ data: {} });

    await ProductService.getSearchProducts({
      keyword: "red&blue 100%",
      page: 2,
      sort: "name-asc",
    });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/products/search",
        params: {
          keyword: "red&blue 100%",
          page: 2,
          sort: "name-asc",
        },
      }),
    );
  });

  it("gets relevant products by type and product ID", async () => {
    const data = { success: true, data: [] };
    const request = vi.spyOn(privateApi, "request").mockResolvedValue({ data });

    await expect(
      ProductService.getRelevantProducts({ type: "Keycap", id: 5 }),
    ).resolves.toEqual(data);

    expect(request).toHaveBeenCalledWith({
      method: "GET",
      url: "/api/products/relevant",
      params: { type: "Keycap", id: 5 },
    });
  });
});
