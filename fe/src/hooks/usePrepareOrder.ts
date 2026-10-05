import type { PrepareOrderProps } from "@/features/order/service/order.service";
import { OrderUsecase } from "@/features/order/usecase/order.usecase";
import { useQuery } from "@tanstack/react-query";

export const usePrepareOrder = (payload: PrepareOrderProps[]) => {
  return useQuery({
    queryKey: ["prepare-order", payload],
    queryFn: async () => OrderUsecase.prepareOrder(payload),
  });
};
