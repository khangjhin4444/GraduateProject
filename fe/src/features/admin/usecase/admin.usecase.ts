import { AdminService } from "../service/admin.service";

export const AdminUsecase = {
  getProductDetail: ({ type, page }: { type: string; page: number }) =>
    AdminService.getProductDetail({ type, page }),
  addProduct: (formData: FormData) => AdminService.addProduct(formData),
  editProduct: (productId: number, formData: FormData) =>
    AdminService.editProduct(productId, formData),
  deleteProduct: (variantId: number) => AdminService.deleteProduct(variantId),
  getAdminOrders: ({ status, page }: { status: string; page: number }) =>
    AdminService.getAdminOrders({ status, page }),
  adminCancelOrder: (orderId: number) => AdminService.adminCancelOrder(orderId),
  adminProceedOrder: (orderId: number) =>
    AdminService.adminProceedOrder(orderId),
  adminDeliverOrder: (orderId: number) =>
    AdminService.adminDeliverOrder(orderId),
};
