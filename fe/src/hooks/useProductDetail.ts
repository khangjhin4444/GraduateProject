import { ProductUsecase } from "@/features/product/usecase/product.usecase";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

export const productDetailOptions = (id: number) =>
  queryOptions({
    queryKey: ["product", id],
    queryFn: () => ProductUsecase.getProductDetail(id),
  });

export default function useProductDetail(id: number) {
  return useSuspenseQuery(productDetailOptions(id));
}
