import { Checkbox } from "@/components/ui/checkbox";
import type { CartItemEntity } from "@/features/cart/schema/cart.schema";
import { CartUsecase } from "@/features/cart/usecase/cart.usecase";
import { useAppDispatch } from "@/state/hooks";
import { changeCartQuantityByDelta } from "@/state/profile/profileSlice";
import { formatCurrency } from "@/utils/formatCurrency";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

export default function CartItem({
  item,
  handleToggleCheck,
  handleQuantityChangeParent,
}: {
  item: CartItemEntity & { isChecked: boolean };
  handleToggleCheck: (cartItemID: number) => void;
  handleQuantityChangeParent: (cartItemID: number, Quantity: number) => void;
}) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const [quantity, setQuantity] = useState<number>(item.Quantity);
  const [quantityInput, setQuantityInput] = useState(String(item.Quantity));
  const latestRef = useRef(item.Quantity);
  const syncedRef = useRef(item.Quantity);
  const inFlightRef = useRef(false);
  const [isDelete, setIsDelete] = useState(false);

  const setOptimistic = (next: number) => {
    const delta = next - latestRef.current;
    if (delta === 0) return;
    latestRef.current = next;
    setQuantity(next);
    setQuantityInput(String(next));
    dispatch(changeCartQuantityByDelta(delta));
  };
  const changeItemQuantityMutation = useMutation({
mutationKey: ["cart-quantity"],
    scope: { id: "cart-writes" },
    mutationFn: (payload: { variantId: number; quantity: number }) =>
      CartUsecase.changeItemQuantity(payload),
    onError: (error: AxiosError) => {
      debounced.cancel(); // bỏ các thay đổi đang chờ
      setOptimistic(syncedRef.current); // rollback qua cùng đường -> badge tự đúng
      handleQuantityChangeParent(item.CartItemID, syncedRef.current);
      toast.error(error.message);
      return;
    },
    onSuccess: (_, payload) => {
      syncedRef.current = payload.quantity;
      // handleQuantityChangeParent(item.CartItemID, payload.quantity);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const deleteCartItemMutation = useMutation({
mutationKey: ["cart-item-delete"],
    scope: { id: "cart-writes" },
    mutationFn: ({ variantId }: { variantId: number }) =>
      CartUsecase.deleteCartItem({ variantId }),
    onMutate: () => {
      debounced.cancel();
      setIsDelete(true);
      setOptimistic(0);
      handleQuantityChangeParent(item.CartItemID, 0);
    },
    onError: (error: AxiosError) => {
      setOptimistic(syncedRef.current);
      toast.error(error.message);
      handleQuantityChangeParent(item.CartItemID, syncedRef.current);
      setIsDelete(false);
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const doSync = async () => {
    if (inFlightRef.current) return; // đang có request, xong sẽ tự kiểm tra lại
    const target = latestRef.current;
    if (target < 1 || target === syncedRef.current) return;
    inFlightRef.current = true;
    try {
      console.log("call change with quantity: ", target);
      await changeItemQuantityMutation.mutateAsync({
        variantId: item.VariantID,
        quantity: target,
      });
    } catch {
      return;
    } finally {
      inFlightRef.current = false;
    }

    if (!debounced.isPending() && latestRef.current !== syncedRef.current) {
      void doSync();
    }
  };
  const debounced = useDebouncedCallback(doSync, 500);

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
    if (currentStock > 0 && latestRef.current > currentStock) {
      setOptimistic(currentStock);
      handleQuantityChangeParent(item.CartItemID, currentStock);
      debounced();
  }
}, [currentStock]);

  const canIncrease = !!(quantity < currentStock);
  const canDecrease = !!(quantity > 1);

  const handleQuantityChange = (
    type: "decrease" | "increase" | "input",
    value?: string,
  ) => {
    const current = latestRef.current;
    let next = current;

    if (type === "decrease") next = Math.max(1, current - 1);
    else if (type === "increase") next = Math.min(currentStock, current + 1);
    else if (type === "input" && value !== undefined) {
      setQuantityInput(value);
      if (value === "") {
        return;
      }
      const n = parseInt(value.toString(), 10);
      if (isNaN(n) || n < 1 || currentStock < 1) return;
      next = Math.min(currentStock, n);
      setQuantityInput(String(next));
    }

    setOptimistic(next);
    handleQuantityChangeParent(item.CartItemID, next);
    debounced();
  };
  return (
    <div>
      {!isDelete && (
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
          <div className="block sm:flex-2 mt-4 sm:mt-0">
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
                onChange={(e) => handleQuantityChange("input", e.target.value)}
                onBlur={() => {
                  if (quantityInput === "" || Number(quantityInput) < 1) {
                    setQuantity(latestRef.current);
                    setQuantityInput(String(latestRef.current));
                  }
                }}
                className="w-full text-center text-xl sm:text-lg select-none"
              />
              <button
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
                  <span className="sm:hidden font-semibold">Delete</span>
                  <Trash2 />
                </button>
              </div>
              <Checkbox
                className="w-7 h-7 border-2 border-border"
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
                  {formatCurrency(Number(item.Price) * quantity)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
