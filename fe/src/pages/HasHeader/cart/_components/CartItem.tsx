import type { CartItemEntity } from "@/features/cart/schema/cart.schema";
import { CartUsecase } from "@/features/cart/usecase/cart.usecase";
import { useAppDispatch } from "@/state/hooks";
import { changeCartQuantityByDelta } from "@/state/profile/profileSlice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

export default function CartItem({ item }: { item: CartItemEntity }) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const [quantity, setQuantity] = useState<number>(item.Quantity);
  const latestRef = useRef(item.Quantity);
  const syncedRef = useRef(item.Quantity);
  const inFlightRef = useRef(false);

  const setOptimistic = (next: number) => {
    const delta = next - latestRef.current;
    if (delta === 0) return;
    latestRef.current = next;
    setQuantity(next);
    dispatch(changeCartQuantityByDelta(delta));
  };
  const changeItemQuantityMutation = useMutation({
    mutationFn: (payload: { variantId: number; quantity: number }) =>
      CartUsecase.changeItemQuantity(payload),
    onError: (error: AxiosError) => {
      debounced.cancel(); // bỏ các thay đổi đang chờ
      setOptimistic(syncedRef.current); // rollback qua cùng đường -> badge tự đúng
      toast.error(error.message);
      return;
    },
    onSuccess: (_, payload) => {
      syncedRef.current = payload.quantity;
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
  const doSync = async () => {
    if (inFlightRef.current) return; // đang có request, xong sẽ tự kiểm tra lại
    const target = latestRef.current;
    if (target < 1 || target === syncedRef.current) return;
    inFlightRef.current = true;
    try {
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
      debounced.flush();
    },
    [debounced],
  );
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
  };
  const currentStock = item.Stock;

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
    else if (type === "input") {
      const n = parseInt(value ?? "", 10);
      if (isNaN(n) || n < 1) {
        setQuantity(1);
        return;
      } // chỉ đổi hiển thị, không dispatch, không gọi API
      next = Math.min(currentStock, n);
    }

    setOptimistic(next);
    debounced();
  };
  return (
    <div className="w-full block sm:flex mb-5 p-4 border-border border rounded-2xl gap-4 shadow-lg">
      <div className="block sm:flex-1 h-full">
        <img
          src={item.MainImage}
          className="w-full h-full object-cover rounded-3xl"
        />
      </div>
      <div className="block sm:flex-2">
        <h2 className="font-semibold text-md md:text-lg lg:text-xl mb-2">
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
        <p className="mt-5 text-foreground mb-5">Variant: {item.Color}</p>
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
            value={quantity}
            onChange={(e) => handleQuantityChange("input", e.target.value)}
            onBlur={() => {
              if (quantity < 1) setQuantity(latestRef.current);
            }}
            className="w-full text-center"
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
        <div className="flex flex-col justify-between items-end h-full w-full">
          <div className="text-red-500">
            <Trash2 />
          </div>
          <div className="items-end">
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
  );
}
