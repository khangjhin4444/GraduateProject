import { Button } from "@/components/ui/button";
import type { PrepareOrderProps } from "@/features/order/service/order.service";
import { usePrepareOrder } from "@/hooks/usePrepareOrder";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import OrderForm from "./OrderForm";
import OrderSummary from "./OrderSummary";
import CheckoutSkeleton from "./CheckoutSkeleton";
import { usePlaceOrder } from "@/hooks/usePlaceOrder";

export default function CheckoutPage({
  checkoutItems,
  isBuyNow,
}: {
  checkoutItems: PrepareOrderProps[];
  isBuyNow: boolean;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [shipping, setShipping] = useState<number>(40);

  const { placeOrderMutation } = usePlaceOrder();
  const { data, isPending, isError, error } = usePrepareOrder(checkoutItems);

  useEffect(() => {
    if (data?.warnings) {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    }
  }, [data?.warnings, queryClient]);

  return (
    <main className="px-8 md:px-10 min-h-screen pb-10 mt-4 relative">
      <div className="border-b-2 pb-3">
        <h1 className="text-2xl font-bold">Complete Your Order</h1>
        <p className="text-muted-foreground">
          Enter your delivery details and choose how you would like to pay.
        </p>
      </div>
      {isPending ? (
        <div className="mt-5">
          <CheckoutSkeleton />
        </div>
      ) : isError || !data ? (
        <div className="mt-10 text-red-500 text-xl font-medium">
          Something went wrong: {error?.message || "Retry later"}
        </div>
      ) : data.items.length === 0 ? (
        <div className="mt-10 space-y-4">
          <p className="text-lg font-medium text-destructive">
            None of the selected items are currently available. Please return to
            your cart and choose other items.
          </p>
          <Button variant="outline" onClick={() => navigate("/cart")}>
            Return to cart
          </Button>
        </div>
      ) : (
        <section className="xl:flex xl:gap-10 mt-5 ">
          <div className="xl:flex-2">
            {data.warnings > 0 && (
              <p
                role="status"
                className="mb-4 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200"
              >
                Some selected items were removed or their quantities were
                adjusted because of stock changes. Review the updated order
                summary before placing your order.
              </p>
            )}
            <OrderForm
              setShipping={setShipping}
              items={data.items}
              placeOrderMutation={placeOrderMutation}
              isBuyNow={isBuyNow}
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
