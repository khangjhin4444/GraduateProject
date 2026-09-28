import {
  AdminService,
  type AddProductAdminPayload,
} from "../service/admin.service";

export const AdminUsecase = {
  getProductDetail: ({ type, page }: { type: string; page: number }) =>
    AdminService.getProductDetail({ type, page }),
  addProduct: (payload: AddProductAdminPayload) =>
    AdminService.addProduct(payload),
};
