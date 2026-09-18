import type { RegisterPayload } from "@/feature/auth/service/auth.service";
import { authUsecase } from "@/feature/auth/usecase/auth.usecase";
import { useMutation } from "@tanstack/react-query";

export default function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authUsecase.register(payload),
  });
}
