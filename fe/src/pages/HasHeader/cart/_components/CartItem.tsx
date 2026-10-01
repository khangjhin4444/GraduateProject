import { Checkbox } from "@/components/ui/checkbox";
import type {
  CartItemEntity,
  GetCartResponseEntity,
} from "@/features/cart/schema/cart.schema";
import { CartUsecase } from "@/features/cart/usecase/cart.usecase";
import { formatCurrency } from "@/utils/formatCurrency";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

export default function CartItem({
  item,
  handleToggleCheck,
}: {
  item: CartItemEntity & { isChecked: boolean };
  handleToggleCheck: (cartItemID: number) => void;
}) {
  const queryClient = useQueryClient();
  const [quantityInput, setQuantityInput] = useState(String(item.Quantity));
  const latestQuantityRef = useRef(item.Quantity);
  const syncedQuantityRef = useRef(item.Quantity);
  const editVersionRef = useRef(0);
  const inputFocusedRef = useRef(false);

  const updateCachedQuantity = (next: number) => {
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
  };

  const invalidateIfLast = () => {
    const pending = queryClient.isMutating({
      predicate: (m) => m.options.scope?.id === "cart-writes",
    });
    if (pending === 1) {
      return queryClient.invalidateQueries({ queryKey: ["cart"] });
    }
  };

  const changeItemQuantityMutation = useMutation({
    mutationKey: ["cart-quantity"],
    scope: { id: "cart-writes" },
    mutationFn: (payload: {
      variantId: number;
      quantity: number;
      editVersion: number;
    }) => CartUsecase.changeItemQuantity(payload),
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

        const deletedItem = oldCart.items.find(
          (cartItem) => cartItem.VariantID === item.VariantID,
        );
        if (!deletedItem) return oldCart;
        return {
          ...oldCart,
          items: oldCart.items.filter(
            (cartItem) => cartItem.VariantID !== item.VariantID,
          ),
          cartQuantity: Math.max(
            0,
            oldCart.cartQuantity - deletedItem.Quantity,
          ),
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

  const commitQuantity = (next: number) => {
    editVersionRef.current += 1;
    const editVersion = editVersionRef.current;
    setQuantityInput(String(next));
    updateCachedQuantity(next);
    debounced(next, editVersion);
  };

  useEffect(
    () => () => {
      if (queryClient.isMutating({ mutationKey: ["clear-cart"] }) > 0) {
        debounced.cancel();
      } else {
        debounced.flush();
      }
    },
    [debounced, queryClient],
  );

  const currentStock = item.Stock;
  useEffect(() => {
    latestQuantityRef.current = item.Quantity;
    if (!inputFocusedRef.current) {
      setQuantityInput(String(item.Quantity));
    }
  }, [item.Quantity]);

  const canIncrease = !!(item.Quantity < currentStock);
  const canDecrease = !!(item.Quantity > 1);

  const handleQuantityChange = (
    type: "decrease" | "increase" | "input",
    value?: string,
  ) => {
    const current = latestQuantityRef.current;
    let next = current;

    if (type === "decrease") next = Math.max(1, current - 1);
    else if (type === "increase") next = Math.min(currentStock, current + 1);
    else if (type === "input" && value !== undefined) {
      setQuantityInput(value);
      if (value === "") {
        debounced.cancel();
        return;
      }
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1 || currentStock < 1) {
        debounced.cancel();
        return;
      }
      next = Math.min(currentStock, n);
    }

    if (next !== current) commitQuantity(next);
  };
  return (
    <div>
      <div className="w-full block sm:flex mb-5 p-4 border-border border rounded-2xl gap-4 shadow-lg relative min-h-60">
        {currentStock === 0 && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="border-4 border-accent/80 text-accent/80 text-2xl md:text-3xl font-bold uppercase tracking-widest px-6 py-2 rounded-xl rotate-[-10deg] bg-background/80 shadow-lg">
              Out of Stock
            </div>
          </div>
        )}
        <div className="block sm:flex-1 min-h-full w-full">
          <img
            src={item.MainImage}
            className="w-full h-full object-cover rounded-3xl"
          />
        </div>
        <div className="block sm:flex-2 mt-4 sm:mt-0 relative">
          <h2 className="font-semibold text-xl md:text-lg lg:text-xl mb-2">
            {item.Name}
          </h2>
          <div>
            <span className="bg-muted px-4 py-1 rounded-3xl text-muted-foreground mr-2 text-sm">
              {item.ProductType}
            </span>
            <span className="bg-muted px-4 py-1 rounded-3xl text-muted-foreground text-sm">
              {item.SubType}
            </span>
          </div>
          <p className="mt-5 text-foreground text-lg mb-5">
            Variant: {item.Color}
          </p>
          <div className="flex justify-center items-center w-1/2  border-2 border-border py-2 px-3 rounded-2xl ">
            <button
              aria-label="Decrease quantity"
              disabled={!canDecrease}
              onClick={() => handleQuantityChange("decrease")}
              className={`${canDecrease ? "cursor-pointer" : "cursor-not-allowed"} text-muted-foreground hover:text-foreground`}
            >
              <Minus />
            </button>
            <input
              type="number"
              max={currentStock}
              value={quantityInput}
              onFocus={() => {
                inputFocusedRef.current = true;
              }}
              onChange={(e) => handleQuantityChange("input", e.target.value)}
              onBlur={() => {
                inputFocusedRef.current = false;
                setQuantityInput(String(latestQuantityRef.current));
              }}
              className="w-full text-center text-xl sm:text-lg select-none"
            />
            <button
              aria-label="Increase quantity"
              disabled={!canIncrease}
              onClick={() => handleQuantityChange("increase")}
              className={`${canIncrease ? "cursor-pointer" : "cursor-not-allowed"} text-muted-foreground hover:text-foreground`}
            >
              <Plus />
            </button>
          </div>
        </div>
        <div className="block sm:flex-1 ">
          <div className="flex sm:flex-col justify-between items-end h-full w-full flex-row-reverse mt-3 sm:mt-0">
            <div className="text-red-500 relative z-20">
              <button
                className="cursor-pointer flex gap-2 border-2 border-red-500 rounded-2xl p-2 sm:border-none sm:rounded-none sm:gap-0"
                disabled={changeItemQuantityMutation.isPending}
                onClick={() =>
                  deleteCartItemMutation.mutate({ variantId: item.VariantID })
                }
              >
                <Trash2 />
              </button>
            </div>
            <Checkbox
              className="sm:w-7 sm:h-7 border-2 border-border absolute sm:relative top-6 right-6 w-10 h-10"
              checked={item.isChecked}
              onClick={() => {
                handleToggleCheck(item.CartItemID);
              }}
            />
            <div>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(Number(item.Price))} EACH
              </span>
              <br />
              <div className="text-accent font-semibold text-right text-lg">
                {formatCurrency(Number(item.Price) * item.Quantity)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
