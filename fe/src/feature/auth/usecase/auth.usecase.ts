import {
  authService,
  type LoginPayload,
  type RegisterPayload,
} from "../service/auth.service";

export const authUsecase = {
  register: (payload: RegisterPayload) => authService.register(payload),
  login: (payload: LoginPayload) => authService.login(payload),
};
