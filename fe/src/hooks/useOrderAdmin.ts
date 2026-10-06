import { AdminUsecase } from "@/features/admin/usecase/admin.usecase";

import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";

export const useAdminOrdersOptions = (status: string) =>
  infiniteQueryOptions({
    queryKey: ["admin-orders", status],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      AdminUsecase.getAdminOrders({ status, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.nextPage : undefined,
  });

export default function useAdminOrders(status: string) {
  return useInfiniteQuery(useAdminOrdersOptions(status));
}
