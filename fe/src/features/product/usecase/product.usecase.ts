import { ProductService } from "../service/product.service";

export const ProductUsecase = {
  getProductDetail: async (id: number) => ProductService.getProductById(id),
  getProducts: async ({
    type,
    page,
    limit = 20,
    sort = "default",
    sub = undefined,
  }: {
    type: string;
    page: number;
    limit?: number;
    sort?: string;
    sub?: string;
  }) => ProductService.getProducts({ type, page, limit, sort, sub }),
  getSearchProducts: async ({
    keyword,
    page,
    sort,
  }: {
    keyword: string;
    page: number;
    sort?: string;
  }) => ProductService.getSearchProducts({ keyword, page, sort }),
};
