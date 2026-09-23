import { ProductUsecase } from "@/features/product/usecase/product.usecase";
import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";

export const useSearchProductsOption = ({
  keyword,
  page,
  sort,
}: {
  keyword: string;
  page: number;
  sort?: string;
}) =>
  infiniteQueryOptions({
    queryKey: ["products", keyword, page, sort],
    initialPageParam: page,
    queryFn: ({ pageParam }) =>
      ProductUsecase.getSearchProducts({ keyword, page: pageParam, sort }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.nextPage : undefined,
    staleTime: 1000 * 60,
  });

export default function useSearchProducts({
  keyword,
  page,
  sort,
}: {
  keyword: string;
  page: number;
  sort?: string;
}) {
  return useInfiniteQuery(useSearchProductsOption({ keyword, page, sort }));
}
