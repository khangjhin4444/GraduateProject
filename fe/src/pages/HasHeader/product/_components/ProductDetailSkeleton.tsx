import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 font-sans">
      <section className="flex flex-col gap-10 md:flex-row">
        <div className="w-full p-3 md:w-1/2 md:p-0">
          <Skeleton className="h-125 w-full rounded-lg" />
          <div className="flex justify-center gap-3 overflow-hidden px-1 py-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-20 w-20 shrink-0 rounded-md md:h-24 md:w-24"
              />
            ))}
          </div>
        </div>

        <div className="w-full md:w-1/2">
          <Skeleton className="mb-4 h-12 w-4/5" />
          <Skeleton className="mb-6 h-10 w-2/5" />

          <div className="mb-8">
            <Skeleton className="mb-4 h-8 w-2/5" />
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-32 rounded-lg" />
              ))}
            </div>
          </div>

          <Skeleton className="mb-6 h-12 w-full rounded-lg" />
          <div className="flex flex-col gap-4 xl:flex-row">
            <Skeleton className="h-16 flex-1 rounded-lg" />
            <Skeleton className="h-16 flex-1 rounded-lg" />
          </div>
        </div>
      </section>

      <section className="mt-20 px-5">
        <Skeleton className="mx-auto mb-10 h-9 w-56" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="mt-6 h-7 w-40" />
          <Skeleton className="h-5 w-10/12" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mx-auto mt-6 h-64 w-3/4 rounded-lg" />
        </div>

        <Skeleton className="mb-6 mt-12 h-9 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      </section>
    </div>
  );
}
