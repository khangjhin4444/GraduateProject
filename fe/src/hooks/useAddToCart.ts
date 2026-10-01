import { CartUsecase } from "@/features/cart/usecase/cart.usecase";
import { useAppDispatch } from "@/state/hooks";
import { changeCartQuantityByDelta } from "@/state/profile/profileSlice";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type AddToCartPayload = {
  variantId: number;
  quantity: number;
};

export const useAddToCart = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["cart-add"],
    scope: { id: "cart-writes" },
    mutationFn: async (payload: AddToCartPayload) => {
      return CartUsecase.addToCart(payload);
    },
    onMutate: async (payload) => {
      // const previousCartQuantity = cartQuantity;
      // const optimisticQuantity =
      //   Number(previousCartQuantity) + payload.quantity;
      dispatch(changeCartQuantityByDelta(payload.quantity));
      // return { previousCartQuantity };
    },
    onError: (_, payload) => {
      // if (context?.previousCartQuantity !== undefined) {
      //   dispatch(updateCartQuantity(context.previousCartQuantity));
      // }
      dispatch(changeCartQuantityByDelta(-payload.quantity));
    },
    onSettled: () => {
      const pending = queryClient.isMutating({
        predicate: (m) => m.options.scope?.id === "cart-writes",
      });
      if (pending === 1) queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};
