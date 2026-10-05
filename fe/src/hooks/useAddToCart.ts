import type { GetCartResponseEntity } from "@/features/cart/schema/cart.schema";
import { CartUsecase } from "@/features/cart/usecase/cart.usecase";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type AddToCartPayload = {
  variantId: number;
  quantity: number;
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["cart-add"],
    scope: { id: "cart-writes" },
    mutationFn: async (payload: AddToCartPayload) => {
      return CartUsecase.addToCart(payload);
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData(["cart"]);
      queryClient.setQueryData(["cart"], (oldCart: GetCartResponseEntity) => {
        if (!oldCart) return oldCart;

        return {
          ...oldCart,
          cartQuantity: oldCart.cartQuantity + payload.quantity,
        };
      });
      return { previousCart };
    },
    onError: (__, _, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
      }
    },
    onSettled: () => {
      const pending = queryClient.isMutating({
        predicate: (m) => m.options.scope?.id === "cart-writes",
      });
      if (pending === 1) queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};
