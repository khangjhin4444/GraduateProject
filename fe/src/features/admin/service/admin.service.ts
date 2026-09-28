import { privateApi } from "@/api/axios.instance";
import {
  AdminProductResponseSchema,
  type AddProductAdminResponseEntity,
  type AdminProductResponseEntity,
} from "../schema/admin.schema";

type GetProductDetail = ({
  type,
  page,
}: {
  type: string;
  page: number;
}) => Promise<AdminProductResponseEntity>;

type AddProductAdmin = (
  formData: FormData,
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
  addProduct: async (formData: FormData) => {
    const response = await privateApi.request({
      method: "POST",
      url: "/api/products/admin/new",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      data: formData,
      timeout: 120000, // 2 phút — upload nhiều ảnh có thể mất thời gian
    });

    return response.data as AddProductAdminResponseEntity;
  },
};

