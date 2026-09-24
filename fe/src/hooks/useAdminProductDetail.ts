import { AdminUsecase } from "@/features/admin/usecase/admin.usecase";
import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";

export const useAdminProductDetailOption = ({
  type,
  page,
  enable,
}: {
  type: string;
  page: number;
  enable?: boolean | undefined;
}) =>
  infiniteQueryOptions({
    queryKey: ["admin-products", type, page],
    initialPageParam: page,
    queryFn: ({ pageParam }) =>
      AdminUsecase.getProductDetail({ type, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.nextPage : undefined,
    staleTime: 1000 * 60,
    enabled: enable,
  });

export default function useAdminProductDetail({
  type,
  page,
  enable,
}: {
  type: string;
  page?: number;
  limit?: number;
  enable?: boolean;
}) {
  return useInfiniteQuery(
    useAdminProductDetailOption({ type, page: page ?? 1, enable }),
  );
}
