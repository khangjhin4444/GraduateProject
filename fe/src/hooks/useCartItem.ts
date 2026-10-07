import type {
  CartItemEntity,
  GetCartResponseEntity,
} from "@/features/cart/schema/cart.schema";
import { CartUsecase } from "@/features/cart/usecase/cart.usecase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

type QuantityChangeType = "decrease" | "increase" | "input";

export function useCartItem(item: CartItemEntity) {
  const queryClient = useQueryClient();
  const [quantityInput, setQuantityInput] = useState(String(item.Quantity));
  const latestQuantityRef = useRef(item.Quantity);
  const syncedQuantityRef = useRef(item.Quantity);
  const editVersionRef = useRef(0);
  const inputFocusedRef = useRef(false);

  const updateCachedQuantity = useCallback(
    (next: number) => {
      latestQuantityRef.current = next;
      queryClient.setQueryData<GetCartResponseEntity>(["cart"], (cart) => {
        if (!cart) return cart;

        const currentItem = cart.items.find(
          (cartItem) => cartItem.VariantID === item.VariantID,
        );
        if (!currentItem) return cart;

        const quantityDelta = next - currentItem.Quantity;
        return {
          ...cart,
          cartQuantity: Math.max(0, cart.cartQuantity + quantityDelta),
          items: cart.items.map((cartItem) =>
            cartItem.VariantID === item.VariantID
              ? { ...cartItem, Quantity: next }
              : cartItem,
          ),
        };
      });
    },
    [item.VariantID, queryClient],
  );

  const changeItemQuantityMutation = useMutation({
    mutationKey: ["cart-quantity"],
    scope: { id: "cart-writes" },
    mutationFn: (payload: {
      variantId: number;
      quantity: number;
      editVersion: number;
    }) =>
      CartUsecase.changeItemQuantity({
        variantId: payload.variantId,
        quantity: payload.quantity,
      }),
    onError: (error, payload) => {
      toast.error(error.message);
      if (payload.editVersion !== editVersionRef.current) return;

      updateCachedQuantity(syncedQuantityRef.current);
      setQuantityInput(String(syncedQuantityRef.current));
    },
    onSuccess: (_, payload) => {
      syncedQuantityRef.current = payload.quantity;
    },
    onSettled: () => invalidateIfLast(),
  });

  const deleteCartItemMutation = useMutation({
    mutationKey: ["cart-item-delete"],
    scope: { id: "cart-writes" },
    mutationFn: ({ variantId }: { variantId: number }) =>
      CartUsecase.deleteCartItem({ variantId }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      debounced.cancel();
      const previousCart = queryClient.getQueryData<GetCartResponseEntity>([
        "cart",
      ]);
      const itemIndex =
        previousCart?.items.findIndex(
          (cartItem) => cartItem.VariantID === item.VariantID,
        ) ?? -1;
      const deletedItem =
        itemIndex >= 0 ? previousCart?.items[itemIndex] : undefined;
      queryClient.setQueryData<GetCartResponseEntity>(["cart"], (oldCart) => {
        if (!oldCart) return oldCart;

        const cachedItem = oldCart.items.find(
          (cartItem) => cartItem.VariantID === item.VariantID,
        );
        if (!cachedItem) return oldCart;
        return {
          ...oldCart,
          items: oldCart.items.filter(
            (cartItem) => cartItem.VariantID !== item.VariantID,
          ),
          cartQuantity: Math.max(0, oldCart.cartQuantity - cachedItem.Quantity),
        };
      });
      return { deletedItem, itemIndex };
    },
    onError: (error, _, context) => {
      toast.error(error.message);
      const deletedItem = context?.deletedItem;
      if (!deletedItem) return;

      queryClient.setQueryData<GetCartResponseEntity>(["cart"], (cart) => {
        if (
          !cart ||
          cart.items.some(
            (cartItem) => cartItem.VariantID === deletedItem.VariantID,
          )
        ) {
          return cart;
        }

        const items = [...cart.items];
        items.splice(Math.min(context.itemIndex, items.length), 0, deletedItem);
        return {
          ...cart,
          items,
          cartQuantity: cart.cartQuantity + deletedItem.Quantity,
        };
      });
    },
    onSettled: () => invalidateIfLast(),
  });

  const debounced = useDebouncedCallback(
    (quantity: number, editVersion: number) => {
      changeItemQuantityMutation.mutate({
        variantId: item.VariantID,
        quantity,
        editVersion,
      });
    },
    500,
  );

  const invalidateIfLast = () => {
    const pending = queryClient.isMutating({
      predicate: (mutation) => mutation.options.scope?.id === "cart-writes",
    });
    if (pending === 1 && !debounced.isPending()) {
      return queryClient.invalidateQueries({ queryKey: ["cart"] });
    }
  };

  const commitQuantity = (next: number) => {
    editVersionRef.current += 1;
    const editVersion = editVersionRef.current;
    setQuantityInput(String(next));
    updateCachedQuantity(next);
    debounced(next, editVersion);
  };

  useEffect(
    () => () => {
      debounced.flush();
    },
    [debounced, queryClient],
  );

  useEffect(() => {
    latestQuantityRef.current = item.Quantity;
    if (!inputFocusedRef.current) {
      setQuantityInput(String(item.Quantity));
    }
  }, [item.Quantity]);

  const handleQuantityChange = (type: QuantityChangeType, value?: string) => {
    const current = latestQuantityRef.current;
    let next = current;

    if (type === "decrease") next = Math.max(1, current - 1);
    else if (type === "increase") next = Math.min(item.Stock, current + 1);
    else if (type === "input" && value !== undefined) {
      setQuantityInput(value);
      if (value === "") {
        updateCachedQuantity(syncedQuantityRef.current);
        debounced.cancel();
        return;
      }
      const quantity = Number(value);
      if (!Number.isInteger(quantity) || quantity < 1 || item.Stock < 1) {
        updateCachedQuantity(syncedQuantityRef.current);
        debounced.cancel();
        return;
      }
      next = Math.min(item.Stock, quantity);
    }

    if (next !== current) commitQuantity(next);
  };

  const handleInputFocus = () => {
    inputFocusedRef.current = true;
  };

  const handleInputBlur = () => {
    inputFocusedRef.current = false;
    setQuantityInput(String(latestQuantityRef.current));
  };

  return {
    quantityInput,
    canIncrease: item.Quantity < item.Stock,
    canDecrease: item.Quantity > 1,
    isQuantityUpdating: changeItemQuantityMutation.isPending,
    handleQuantityChange,
    handleInputFocus,
    handleInputBlur,
    deleteItem: () =>
      deleteCartItemMutation.mutate({ variantId: item.VariantID }),
  };
}
