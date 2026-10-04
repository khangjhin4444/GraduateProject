import { CartUsecase } from "@/features/cart/usecase/cart.usecase";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const cartQueryOptions = queryOptions({
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

export function useCart() {
  return useSuspenseQuery(cartQueryOptions);
}
