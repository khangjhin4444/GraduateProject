import { CartUsecase } from "@/features/cart/usecase/cart.usecase";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { updateCartQuantity } from "@/state/profile/profileSlice";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type AddToCartPayload = {
  variantId: number;
  quantity: number;
};

export const useAddToCart = () => {
  const dispatch = useAppDispatch();
  const cartQuantity = useAppSelector((state) => state.profile.cartQuantity);
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["cart-add"],
    scope: { id: "cart-writes" },
    mutationFn: async (payload: AddToCartPayload) => {
      return CartUsecase.addToCart(payload);
    },
    onMutate: async (payload) => {
      const previousCartQuantity = cartQuantity;
      const optimisticQuantity =
        Number(previousCartQuantity) + payload.quantity;
      dispatch(updateCartQuantity(optimisticQuantity));
      return { previousCartQuantity };
    },
    onError: (_, __, context) => {
      if (context?.previousCartQuantity !== undefined) {
        dispatch(updateCartQuantity(context.previousCartQuantity));
      }
    },
    onSuccess: (data) => {
      dispatch(updateCartQuantity(Number(data.newQuantity!)));
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};
