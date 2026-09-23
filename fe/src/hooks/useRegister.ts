import type { RegisterPayload } from "@/features/auth/service/auth.service";
import { authUsecase } from "@/features/auth/usecase/auth.usecase";
import { useMutation } from "@tanstack/react-query";

export default function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authUsecase.register(payload),
  });
}
