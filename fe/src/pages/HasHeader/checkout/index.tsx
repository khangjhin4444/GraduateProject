import { usePrepareOrder } from "@/hooks/usePrepareOrder";

import { Navigate, useLocation, useNavigate } from "react-router";
import OrderForm from "./_components/OrderForm";
import OrderSummary from "./_components/OrderSummary";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PlaceOrderProps } from "@/features/order/service/order.service";
import { OrderUsecase } from "@/features/order/usecase/order.usecase";
import { AxiosError } from "axios";
import { toast } from "sonner";

export default function Page() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const checkoutItems = location.state?.checkoutItems || [];
  if (checkoutItems.length === 0) {
    return <Navigate to="/cart" replace />;
  }
  const placeOrderMutation = useMutation({
    mutationFn: (payload: PlaceOrderProps) => OrderUsecase.placeOrder(payload),
    onMutate: () => {
      const toastId = toast.loading("Placing Order...");
      return { toastId };
    },
    onError: (error, _, context) => {
      if (error instanceof AxiosError && error.response?.data?.message) {
        toast.error(error.response.data.message, { id: context?.toastId });
      } else {
        toast.error(error.message, { id: context?.toastId });
      }
    },
    onSuccess: (_, __, context) => {
      toast.success("Order Placed!", { id: context?.toastId });
      navigate("/order", { replace: true });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
  const { data, isPending, isError, error } = usePrepareOrder(checkoutItems);
  const [shipping, setShipping] = useState<number>(40);
  if (data) console.log(data);
  return (
    <main className="px-8 md:px-10 min-h-screen pb-10 mt-4 relative">
      <div className="border-b-2 pb-3">
        <h1 className="text-2xl font-bold">Complete Your Order</h1>
        <p className="text-muted-foreground">
          Enter your delivery details and choose how you would like to pay.
        </p>
      </div>
      {isPending ? (
        <div className="mt-10 text-xl font-medium">Loading...</div>
      ) : isError || !data ? (
        <div className="mt-10 text-red-500 text-xl font-medium">
          Something went wrong: {error?.message || "Retry later"}
        </div>
      ) : (
        <section className="xl:flex xl:gap-10 mt-5 ">
          <div className="xl:flex-2">
            <OrderForm
              setShipping={setShipping}
              items={data.items}
              placeOrderMutation={placeOrderMutation}
            />
          </div>
          <div className="block xl:flex-1 xl:sticky top-32 h-fit">
            <OrderSummary
              items={data.items}
              count={data.items.reduce(
                (count, item) => count + item.Quantity,
                0,
              )}
              subTotal={data.subTotal}
              shipping={shipping}
              placeOrderMutation={placeOrderMutation}
            />
          </div>
        </section>
      )}
    </main>
  );
}
