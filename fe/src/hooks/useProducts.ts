import { ProductUsecase } from "@/features/product/usecase/product.usecase";
import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";

export const useProductsOption = ({
  type,
  page,
  limit,
  sort,
  sub,
  enable,
}: {
  type: string;
  page: number;
  limit?: number;
  sort?: string;
  sub?: string;
  enable?: boolean | undefined;
}) =>
  infiniteQueryOptions({
    queryKey: ["products", type, sort, sub],
    initialPageParam: page,
    queryFn: ({ pageParam }) =>
      ProductUsecase.getProducts({ type, page: pageParam, limit, sort, sub }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.nextPage : undefined,
    staleTime: 1000 * 60,
    enabled: enable,
  });

export default function useProducts({
  type,
  page,
  limit,
  sort,
  sub,
  enable,
}: {
  type: string;
  page: number;
  limit?: number;
  sort?: string;
  sub?: string;
  enable?: boolean;
}) {
  return useInfiniteQuery(
    useProductsOption({ type, page, limit, sort, sub, enable }),
  );
}
