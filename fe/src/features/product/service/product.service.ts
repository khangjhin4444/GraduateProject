import { privateApi, publicApi } from "@/api/axios.instance";
import {
  ProductDetailResponseSchema,
  ProductResponseSchema,
  SearchProductResponseSchema,
  type ProductDetailResponseEntity,
  type ProductResponseEntity,
  type SearchProductResponseEntity,
} from "../schema/product.schema";

type GetProductById = (id: number) => Promise<ProductDetailResponseEntity>;
type GetProducts = ({
  type,
  page,
  limit,
  sort,
  sub,
}: {
  type: string;
  page: number;
  limit?: number;
  sort?: string;
  sub?: string;
}) => Promise<ProductResponseEntity>;
type GetSearchProducts = ({
  keyword,
  page,
  sort,
}: {
  keyword: string;
  page: number;
  sort?: string;
}) => Promise<SearchProductResponseEntity>;
type ProductService = {
  getProductById: GetProductById;
  getProducts: GetProducts;
  getSearchProducts: GetSearchProducts;
};

export const ProductService: ProductService = {
  getProductById: async (id: number) => {
    const response = await privateApi.request({
      method: "GET",
      url: `/api/products/${id}`,
      responseSchema: ProductDetailResponseSchema,
    });
    return response.data as ProductDetailResponseEntity;
  },
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
  }) => {
    const response = await publicApi.request({
      method: "GET",
      url: `/api/products?type=${type}&page=${page}&limit=${limit}&sort=${sort}&sub=${sub}`,
      responseSchema: ProductResponseSchema,
    });
    return response.data as ProductResponseEntity;
  },
  getSearchProducts: async ({
    keyword,
    page,
    sort,
  }: {
    keyword: string;
    page: number;
    sort?: string;
  }) => {
    const response = await publicApi.request({
      method: "GET",
      url: `/api/products/search?keyword=${keyword}&page=${page}&sort=${sort}`,
      responseSchema: SearchProductResponseSchema,
    });
    return response.data as SearchProductResponseEntity;
  },
};
