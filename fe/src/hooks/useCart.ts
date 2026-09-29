import { CartUsecase } from "@/features/cart/usecase/cart.usecase";
import { useSuspenseQuery } from "@tanstack/react-query";

export function useCart() {
  return useSuspenseQuery({
    queryKey: ["cart"],
    queryFn: () => CartUsecase.getCart(),
  });
}
