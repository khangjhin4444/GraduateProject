import { CartUsecase } from "@/features/cart/usecase/cart.usecase";
import type { GetCartResponseEntity } from "@/features/cart/schema/cart.schema";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { updateCartQuantity } from "@/state/profile/profileSlice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";

export const useClearCart = () => {
  const cartQuantity = useAppSelector((state) => state.profile.cartQuantity);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["clear-cart"],
    scope: { id: "cart-writes" },
    mutationFn: () => CartUsecase.clearCartItem(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const oldQuantity = cartQuantity;
      const previousCart = queryClient.getQueryData<GetCartResponseEntity>([
        "cart",
      ]);
      dispatch(updateCartQuantity(0));
      if (previousCart) {
        queryClient.setQueryData<GetCartResponseEntity>(["cart"], {
          ...previousCart,
          items: [],
        });
      }
      return { oldQuantity, previousCart };
    },
    onSuccess: async () => {
      dispatch(updateCartQuantity(0));
      queryClient.setQueryData<GetCartResponseEntity>(["cart"], (cart) =>
        cart ? { ...cart, items: [] } : cart,
      );
    },
    onSettled: () => {
      const pending = queryClient.isMutating({
        predicate: (m) => m.options.scope?.id === "cart-writes",
      });
      if (pending === 1) queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: async (
      error: AxiosError,
      _: unknown,
      context:
        | {
            oldQuantity: number;
            previousCart: GetCartResponseEntity | undefined;
          }
        | undefined,
    ) => {
      toast.error(error.message);
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
      }
      try {
        const cart = await CartUsecase.getCart();
        queryClient.setQueryData(["cart"], cart);
        dispatch(
          updateCartQuantity(
            cart.items.reduce((total, item) => total + item.Quantity, 0),
          ),
        );
      } catch {
        if (context) dispatch(updateCartQuantity(context.oldQuantity));
      }
    },
  });
};
