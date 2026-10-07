import type { OrderEntity } from "@/features/admin/schema/admin.schema";
import { AdminUsecase } from "@/features/admin/usecase/admin.usecase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

export const useAdminOrderAction = (order: OrderEntity) => {
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
  return {
    handleCancelOrder,
    handleDeliverOrder,
    handleProceedOrder,
    isProceedPending: proceedOrderMutation.isPending,
    isDeliverPending: deliverOrderMutation.isPending,
    isCancelPending: cancelOrderMutation.isPending,
  };
};
