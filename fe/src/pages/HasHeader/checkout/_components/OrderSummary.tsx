import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { OrderProdudctEntity } from "@/features/order/schema/order.schema";
import type { PlaceOrderProps } from "@/features/order/service/order.service";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatSubtype } from "@/utils/formatSubtype";
import type { UseMutationResult } from "@tanstack/react-query";
import { Dot, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router";

export default function OrderSummary({
  subTotal,
  items,
  count,
  shipping,
  placeOrderMutation,
}: {
  subTotal: number;
  items: OrderProdudctEntity[];
  count: number;
  shipping: number;
  placeOrderMutation: UseMutationResult<
    {
      success: boolean;
      message: string;
      orderId: number;
    },
    Error,
    PlaceOrderProps,
    {
      toastId: string | number;
    }
  >;
}) {
  const navigate = useNavigate();
  return (
    <Card className=" shadow-2xl px-4 py-5 bg-background w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        <p className="text-muted-foreground">
          {count} {count > 1 ? "items" : "item"}
        </p>
      </div>
      <div className="overflow-auto max-h-60 py-1 border-b-2 scrollbar-none">
        {items.map((item) => {
          return (
            <div className="flex mb-5 gap-4" key={item.VariantID}>
              <div className="relative">
                <img
                  src={item.MainImage}
                  alt=""
                  className="rounded-2xl w-20 md:w-40 xl:w-25"
                />
                <div className="absolute top-1 right-1 bg-accent rounded-full flex items-center justify-center w-7 h-7 text-accent-foreground font-medium">
                  {item.Quantity > 99 ? "99+" : item.Quantity}
                </div>
              </div>
              <div className=" flex flex-col text-md md:text-lg xl:text-md">
                <p className="font-medium ">{item.Name}</p>
                <div className="flex items-center text-muted-foreground">
                  {formatSubtype(item.ProductType)}
                  <Dot />
                  {formatSubtype(item.SubType)}
                </div>
                <p className="mt-auto font-semibold">
                  {formatCurrency(Number(item.Price) * item.Quantity)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-b-2 pb-2">
        <div className="flex items-center">
          <p className="text-muted-foreground">Subtotal</p>
          <p className="ms-auto text-foreground text-lg">
            {formatCurrency(subTotal)}
          </p>
        </div>
        <div className="flex items-center">
          <p className="text-muted-foreground">Shipping</p>
          <p className="ms-auto text-foreground text-lg">
            {formatCurrency(shipping * 1000)}
          </p>
        </div>
      </div>
      <div className="flex justify-between">
        <p className="text-foreground font-semibold text-xl">Total</p>
        <p className="text-accent text-xl font-semibold">
          {formatCurrency(subTotal + shipping * 1000)}
        </p>
      </div>
      <Button
        className="py-7 text-xl bg-primary text-primary-foreground cursor-pointer hover:zoom-105"
        type="submit"
        form="checkout-form"
        disabled={placeOrderMutation.isPending}
      >
        {placeOrderMutation.isPending ? "Placing Order" : "Place Order"}
      </Button>
      <button
        className="cursor-pointer mb-4 mt-2 flex items-center justify-center text-muted-foreground text-lg"
        onClick={() => navigate("/cart")}
      >
        <ChevronLeft />
        Return to cart
      </button>
    </Card>
  );
}
