import { authService, type RegisterPayload } from "../service/auth.service";

export const authUsecase = {
  register: (payload: RegisterPayload) => authService.register(payload),
};
