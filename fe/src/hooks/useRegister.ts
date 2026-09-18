import type { RegisterPayload } from "@/feature/auth/service/auth.service";
import { authUsecase } from "@/feature/auth/usecase/auth.usecase";
import { mutationOptions, useMutation } from "@tanstack/react-query";

export const registerOptions = (payload: RegisterPayload) =>
  mutationOptions({
    mutationFn: () => authUsecase.register(payload),
  });

export default function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authUsecase.register(payload),
  });
}
