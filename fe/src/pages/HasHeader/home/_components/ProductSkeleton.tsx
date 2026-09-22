import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ProductSkeletonCard() {
  return (
    <Card className="relative mx-auto w-full max-w-sm overflow-hidden border-2 border-gray-300 pt-0">
      <Skeleton className="aspect-square rounded-none" />
      <CardHeader className="flex flex-col gap-3">
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-4 w-2/5" />
        <div className="flex min-h-8 items-center justify-center gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton className="h-6 w-6 rounded-full" key={index} />
          ))}
        </div>
        <div className="flex items-center gap-3 border-t-2 pt-2">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </CardHeader>
    </Card>
  );
}

export default function ProductSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 gap-y-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <ProductSkeletonCard key={index} />
      ))}
    </div>
  );
}
