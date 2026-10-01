import { CartUsecase } from "@/features/cart/usecase/cart.usecase";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCart() {
  return useSuspenseQuery({
    queryKey: ["cart"],
    queryFn: () =>
      CartUsecase.getCart().then((data) => {
        if (data.warnings > 0) {
          toast.info(
            `${data.warnings} ${data.warnings > 1 ? "items's" : "item's"} quantity reduce due to current Stock`,
          );
        }
        return data;
      }),
  });
}
