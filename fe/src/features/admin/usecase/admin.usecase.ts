import { AdminService } from "../service/admin.service";

export const AdminUsecase = {
  getProductDetail: ({ type, page }: { type: string; page: number }) =>
    AdminService.getProductDetail({ type, page }),
};
