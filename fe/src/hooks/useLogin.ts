import type { LoginPayload } from "@/features/auth/service/auth.service";
import { authUsecase } from "@/features/auth/usecase/auth.usecase";
import { useMutation } from "@tanstack/react-query";

export default function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginPayload) => authUsecase.login(payload),
  });
}
