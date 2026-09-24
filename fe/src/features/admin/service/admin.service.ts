import { privateApi } from "@/api/axios.instance";
import {
  AdminProductResponseSchema,
  type AdminProductResponseEntity,
} from "../schema/admin.schema";

type GetProductDetail = ({
  type,
  page,
}: {
  type: string;
  page: number;
}) => Promise<AdminProductResponseEntity>;

type AdminServiceType = {
  getProductDetail: GetProductDetail;
  // deleteProductAdmin: DeleteProductAdmin;
  // updateProductVariantAdmin: UpdateProductVariantAdmin;
  // addProduct: AddProductAdmin;
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
};
