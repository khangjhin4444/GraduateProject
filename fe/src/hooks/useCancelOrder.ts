import type { OrderEntity } from "@/features/admin/schema/admin.schema";
import { OrderUsecase } from "@/features/order/usecase/order.usecase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

export const useCancelOrder = (order: OrderEntity) => {
  const queryClient = useQueryClient();
  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: number) => OrderUsecase.cancelOrder(orderId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", order.Status] });
    },
    onError: (error) => {
      if (error instanceof AxiosError) toast.error(error.message);
      else toast.error("Error hapended when cancel order, try again later.");
    },
  });
  const handleCancelOrder = (orderId: number) => {
    const cancelOrderPromise = cancelOrderMutation.mutateAsync(orderId);
    toast.promise(cancelOrderPromise, {
      loading: "Canceling Order...",
      success: "Order Canceled",
    });
  };
  return {
    handleCancelOrder,
  };
};
