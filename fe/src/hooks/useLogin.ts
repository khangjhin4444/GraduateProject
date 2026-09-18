import type { LoginPayload } from "@/feature/auth/service/auth.service";
import { authUsecase } from "@/feature/auth/usecase/auth.usecase";
import { useMutation } from "@tanstack/react-query";

export default function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginPayload) => authUsecase.login(payload),
  });
}
