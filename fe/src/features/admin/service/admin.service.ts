import { privateApi } from "@/api/axios.instance";
import {
  AdminProductResponseSchema,
  type AddProductAdminResponseEntity,
  type AdminProductResponseEntity,
} from "../schema/admin.schema";

import type { ProductDescription } from "@/pages/admin/products/_components/ProductFormDialog";

type GetProductDetail = ({
  type,
  page,
}: {
  type: string;
  page: number;
}) => Promise<AdminProductResponseEntity>;
type PayloadVariant = {
  color: string;
  stock: number;
  price: number;
  main_image: string;
};
export type AddProductAdminPayload = {
  name: string;
  description: ProductDescription;
  productType: string;
  subType: string;
  variants: PayloadVariant[];
  extraImages: string[];
};
type AddProductAdmin = (
  payload: AddProductAdminPayload,
) => Promise<AddProductAdminResponseEntity>;

type AdminServiceType = {
  getProductDetail: GetProductDetail;
  // deleteProductAdmin: DeleteProductAdmin;
  // updateProductVariantAdmin: UpdateProductVariantAdmin;
  addProduct: AddProductAdmin;
  // getAdminOrders: GetAdminOrders;
  // cancelAdminOrder: CancelAdminOrder;
  // proceedAdminOrder: ProceedAdminOrder;
};

export const AdminService: AdminServiceType = {
  getProductDetail: async function ({
    type,
    page,
  }: {
    type: string;
    page: number;
  }) {
    const response = await privateApi.request({
      method: "GET",
      url: "api/products/admin",
      params: {
        type,
        page,
      },
      responseSchema: AdminProductResponseSchema,
    });
    return response.data as AdminProductResponseEntity;
  },
  addProduct: async (payload: AddProductAdminPayload) => {
    const response = await privateApi.request({
      method: "POST",
      url: "/api/products/admin/new",
      headers: {
        "Content-Type": "application/json",
      },
      data: payload,
    });

    return response.data as AddProductAdminResponseEntity;
  },
};
