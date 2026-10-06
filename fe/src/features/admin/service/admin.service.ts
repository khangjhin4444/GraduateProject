import { privateApi } from "@/api/axios.instance";
import {
  AdminProductResponseSchema,
  type AddProductAdminResponseEntity,
  type EditProductAdminResponseEntity,
  type AdminProductResponseEntity,
  type DeleteProductAdminResponseEntity,
  DeleteProductAdminResponseSchema,
  type GetAdminOrdersResponseEntity,
  GetAdminOrdersResponseSchema,
  type AdminCancelOrderResponseEntity,
  AdminCancelOrderResponseSchema,
  type AdminProceedOrderResponseEntity,
  AdminProceedOrderResponseSchema,
  type AdminDeliverOrderResponseEntity,
  AdminDeliverOrderResponseSchema,
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

type EditProductAdmin = (
  productId: number,
  formData: FormData,
) => Promise<EditProductAdminResponseEntity>;

type DeleteProductAdmin = (
  variantId: number,
) => Promise<DeleteProductAdminResponseEntity>;

type GetAdminOrders = (params: {
  status: string;
  page: number;
}) => Promise<GetAdminOrdersResponseEntity>;

type AdminCancelOrder = (
  orderId: number,
) => Promise<AdminCancelOrderResponseEntity>;

type AdminProceedOrder = (
  orderId: number,
) => Promise<AdminProceedOrderResponseEntity>;

type AdminDeliverOrder = (
  orderId: number,
) => Promise<AdminDeliverOrderResponseEntity>;

type AdminServiceType = {
  getProductDetail: GetProductDetail;
  deleteProduct: DeleteProductAdmin;
  addProduct: AddProductAdmin;
  editProduct: EditProductAdmin;
  getAdminOrders: GetAdminOrders;
  adminCancelOrder: AdminCancelOrder;
  adminProceedOrder: AdminProceedOrder;
  adminDeliverOrder: AdminDeliverOrder;
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
  editProduct: async (productId: number, formData: FormData) => {
    const response = await privateApi.request({
      method: "PUT",
      url: `/api/products/admin/edit/${productId}`,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      data: formData,
      timeout: 120000,
    });

    return response.data as EditProductAdminResponseEntity;
  },
  deleteProduct: async (variantId: number) => {
    const response = await privateApi.request({
      method: "DELETE",
      url: `/api/products/admin/${variantId}`,
      responseSchema: DeleteProductAdminResponseSchema,
    });
    return response.data as DeleteProductAdminResponseEntity;
  },
  getAdminOrders: async ({ status, page }) => {
    const response = await privateApi.request({
      method: "GET",
      url: "/api/orders/admin",
      params: {
        status,
        page,
      },
      responseSchema: GetAdminOrdersResponseSchema,
    });
    return response.data as GetAdminOrdersResponseEntity;
  },
  adminCancelOrder: async (orderId: number) => {
    const response = await privateApi.request({
      method: "PUT",
      url: "/api/orders/admin/cancel",
      data: {
        orderID: orderId,
      },
      responseSchema: AdminCancelOrderResponseSchema,
    });
    return response.data as AdminCancelOrderResponseEntity;
  },
  adminProceedOrder: async (orderId: number) => {
    const response = await privateApi.request({
      method: "PUT",
      url: "/api/orders/admin/proceed",
      data: {
        orderID: orderId,
      },
      responseSchema: AdminProceedOrderResponseSchema,
    });
    return response.data as AdminProceedOrderResponseEntity;
  },
  adminDeliverOrder: async (orderId: number) => {
    const response = await privateApi.request({
      method: "PUT",
      url: "/api/orders/admin/deliver",
      data: {
        orderID: orderId,
      },
      responseSchema: AdminDeliverOrderResponseSchema,
    });
    return response.data as AdminDeliverOrderResponseEntity;
  },
};
