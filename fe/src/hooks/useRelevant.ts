import { ProductUsecase } from "@/features/product/usecase/product.usecase";
import { queryOptions, useQuery } from "@tanstack/react-query";

export const RelevantProductOptions = ({
  type,
  id,
  enable,
}: {
  type: string;
  id: number;
  enable?: boolean;
}) =>
  queryOptions({
    queryKey: ["relevant", type, id],
    queryFn: () => ProductUsecase.getRelevantProducts({ type, id }),
    enabled: enable,
  });

export default function useRelevant({
  type,
  id,
  enable,
}: {
  type: string;
  id: number;
  enable?: boolean;
}) {
  return useQuery(RelevantProductOptions({ type, id, enable }));
}
