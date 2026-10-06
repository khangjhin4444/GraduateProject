import { OrderUsecase } from "@/features/order/usecase/order.usecase";
import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";

export const useOrdersOptions = (status: string) =>
  infiniteQueryOptions({
    queryKey: ["orders", status],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => OrderUsecase.getOrders({ status, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.nextPage : undefined,
  });

export default function useOrders(status: string) {
  return useInfiniteQuery(useOrdersOptions(status));
}
