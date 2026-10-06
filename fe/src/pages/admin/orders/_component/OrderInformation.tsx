import { Button } from "@/components/ui/button";
import { AdminUsecase } from "@/features/admin/usecase/admin.usecase";
import type { OrderEntity } from "@/features/order/schema/order.schema";
import { formatCurrency } from "@/utils/formatCurrency";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Banknote, CreditCard, MapPin, Phone, Truck, User } from "lucide-react";
import { toast } from "sonner";

export default function OrderInformation({ order }: { order: OrderEntity }) {
  const queryClient = useQueryClient();
  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: number) => AdminUsecase.adminCancelOrder(orderId),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-orders", order.Status],
      });
    },
    onError: (error) => {
      if (error instanceof AxiosError) toast.error(error.message);
      else toast.error("Error hapended when cancel order, try again later.");
    },
  });

  const proceedOrderMutation = useMutation({
    mutationFn: (orderId: number) => AdminUsecase.adminProceedOrder(orderId),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-orders", order.Status],
      });
    },
    onError: (error) => {
      if (error instanceof AxiosError) toast.error(error.message);
      else toast.error("Error hapended when confirm order, try again later.");
    },
  });

  const deliverOrderMutation = useMutation({
    mutationFn: (orderId: number) => AdminUsecase.adminDeliverOrder(orderId),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-orders", order.Status],
      });
    },
    onError: (error) => {
      if (error instanceof AxiosError) toast.error(error.message);
      else
        toast.error("Error hapended when set to delivered, try again later.");
    },
  });

  const handleCancelOrder = (orderId: number) => {
    const cancelOrderPromise = cancelOrderMutation.mutateAsync(orderId);
    toast.promise(cancelOrderPromise, {
      loading: "Canceling Order...",
      success: "Order Canceled",
    });
  };

  const handleProceedOrder = (orderId: number) => {
    const proceedOrderPromise = proceedOrderMutation.mutateAsync(orderId);
    toast.promise(proceedOrderPromise, {
      loading: "Confirming Order...",
      success: "Order Confirmed",
    });
  };

  const handleDeliverOrder = (orderId: number) => {
    const deliverOrderPromise = deliverOrderMutation.mutateAsync(orderId);
    toast.promise(deliverOrderPromise, {
      loading: "Confirming Order...",
      success: "Order Confirmed",
    });
  };

  return (
    <>
      <p className="text-muted-foreground font-semibold text-md mb-2">
        RECIPIENT
      </p>
      <div className="flex gap-2 items-center text-md mb-3">
        <User className="w-4 h-4 text-muted-foreground" />
        <p className="text-foreground font-medium">{order.ReceiverName}</p>
      </div>
      <div className="flex gap-2 items-center text-md mb-3">
        <Phone className="w-4 h-4 text-muted-foreground" />
        <p className="text-foreground font-medium">{order.Phone}</p>
      </div>
      <div className="text-md mb-3">
        <p className="text-foreground font-medium">
          <MapPin className="w-4 h-4 text-muted-foreground inline-block mr-2 relative -top-0.5" />
          {order.Address}
        </p>
      </div>
      <div className="p-3 bg-background rounded-2xl">
        Note: {order.Request ? order.Request : "None"}
      </div>
      <div className="sm:flex gap-3 mt-4 pb-3 border-b">
        <div className="flex items-center gap-2">
          <Truck className="text-muted-foreground" />
          <p className="text-muted-foreground">
            {order.Shipping === "Fast" ? "Express" : "Standard"} Delivery
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {order.Payment === "COD" ? (
            <>
              <Banknote />
              <p>Cash on delivery</p>
            </>
          ) : (
            <>
              <CreditCard />
              <p>Bank Transfer</p>
            </>
          )}
        </div>
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between font-semibold text-lg">
          <p>Total</p>
          <p className="text-accent font-bold">
            {formatCurrency(Number(order.Total))}
          </p>
        </div>
        {(order.Status === "Pending" || order.Status === "Confirmed") && (
          <>
            {order.Status !== "Confirmed" ? (
              <div className="px-3 mt-3">
                <Button
                  onClick={() => {
                    handleProceedOrder(order.OrderID);
                  }}
                  disabled={
                    proceedOrderMutation.isPending ||
                    cancelOrderMutation.isPending
                  }
                  className="w-full py-4 border-2 border-foreground bg-background text-foreground hover:border-green-500  hover:text-green-500 cursor-pointer hover:bg-white"
                >
                  {proceedOrderMutation.isPending
                    ? "Confirming Order..."
                    : "Confirm Order"}
                </Button>
              </div>
            ) : (
              <div className="px-3 mt-3">
                <Button
                  onClick={() => {
                    handleDeliverOrder(order.OrderID);
                  }}
                  disabled={
                    deliverOrderMutation.isPending ||
                    cancelOrderMutation.isPending
                  }
                  className="w-full py-4 border-2 border-foreground bg-background text-foreground hover:border-primary  hover:text-primary cursor-pointer hover:bg-white"
                >
                  {deliverOrderMutation.isPending
                    ? "Setting to Delivered..."
                    : "Set to Delivered"}
                </Button>
              </div>
            )}
            <div className="px-3 mt-3">
              <Button
                onClick={() => {
                  handleCancelOrder(order.OrderID);
                }}
                disabled={
                  proceedOrderMutation.isPending ||
                  cancelOrderMutation.isPending ||
                  deliverOrderMutation.isPending
                }
                className="w-full py-4 border-2 border-foreground bg-background text-foreground hover:border-destructive hover:text-destructive cursor-pointer hover:bg-white"
              >
                {cancelOrderMutation.isPending
                  ? "Canceling Order..."
                  : "Cancel Order"}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
