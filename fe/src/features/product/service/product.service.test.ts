import { describe, expect, it, vi } from "vitest";
import { publicApi } from "@/api/axios.instance";
import { ProductService } from "./product.service";

describe("ProductService.getSearchProducts", () => {
  it("passes special keywords as Axios params without changing them", async () => {
    const request = vi
      .spyOn(publicApi, "request")
      .mockResolvedValue({ data: {} } as never);

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
});
