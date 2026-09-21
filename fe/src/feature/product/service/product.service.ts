import { privateApi } from "@/api/axios.instance";
import {
  ProductDetailSchema,
  type ProductDetailResponseEntity,
} from "../schema/product.schema";

type GetProductById = (id: number) => Promise<ProductDetailResponseEntity>;

type ProductService = {
  getProductById: GetProductById;
};

export const ProductService: ProductService = {
  getProductById: async (id: number) => {
    const response = await privateApi.request({
      method: "GET",
      url: `/api/products/${id}`,
      responseSchema: ProductDetailSchema,
    });
    return response.data as ProductDetailResponseEntity;
  },
};
