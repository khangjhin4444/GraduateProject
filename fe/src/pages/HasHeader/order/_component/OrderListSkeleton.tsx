import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OrderListSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <OrderCardSkeleton key={index} />
      ))}
    </>
  );
}

function OrderCardSkeleton() {
  return (
    <Card className="w-full bg-card text-card-foreground mb-5 gap-0! pb-0!">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          {/* Header Skeleton */}
          <div className="h-6 w-48 bg-muted animate-pulse rounded-md" />
          <div className="h-6 w-24 bg-muted animate-pulse rounded-2xl" />
        </div>
      </CardHeader>

      <CardContent className="px-0!">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* CỘT TRÁI: Danh sách Items (Sẽ cuộn và lấy chiều cao theo cột phải) */}
          <div className="md:col-span-2 relative h-[300px] md:h-auto md:border-r">
            <div className="md:absolute md:inset-0 overflow-y-auto p-3">
              <ItemCardSkeleton />
              <ItemCardSkeleton />
              <ItemCardSkeleton />
            </div>
          </div>

          {/* CỘT PHẢI: Thông tin Order (Quyết định chiều cao của toàn bộ Card) */}
          <div className="md:col-span-1 p-5 border-t mt-3 md:mt-0 md:border-none">
            <OrderInformationSkeleton />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton cho từng món hàng (ItemCard)
function ItemCardSkeleton() {
  return (
    <div className="lg:flex items-center border-b pb-2 mb-3">
      <div className="flex gap-5 flex-3 w-full">
        {/* Ảnh */}
        <div className="w-1/2 md:w-1/4 aspect-square bg-muted animate-pulse rounded-3xl" />
        {/* Nội dung */}
        <div className="flex flex-col gap-3 w-full mt-2">
          <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
          <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
          <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
          <div className="h-5 w-1/4 bg-muted animate-pulse rounded mt-auto" />
        </div>
      </div>
      <div className="hidden lg:block flex-1">
        <div className="h-6 w-20 bg-muted animate-pulse rounded ml-auto" />
      </div>
    </div>
  );
}

// Skeleton cho Order Information
function OrderInformationSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="h-5 w-24 bg-muted animate-pulse rounded" />

      <div className="flex gap-2 items-center">
        <div className="h-5 w-5 bg-muted rounded-full" />
        <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
      </div>
      <div className="flex gap-2 items-center">
        <div className="h-5 w-5 bg-muted rounded-full" />
        <div className="h-5 w-1/2 bg-muted animate-pulse rounded" />
      </div>
      <div className="flex gap-2 items-center">
        <div className="h-5 w-5 bg-muted rounded-full" />
        <div className="h-5 w-full bg-muted animate-pulse rounded" />
      </div>

      {/* Note box */}
      <div className="h-14 w-full bg-muted animate-pulse rounded-2xl" />

      <div className="flex justify-between mt-4 pb-3 border-b">
        <div className="h-5 w-1/3 bg-muted animate-pulse rounded" />
        <div className="h-5 w-1/3 bg-muted animate-pulse rounded" />
      </div>

      <div className="flex justify-between items-center mt-2">
        <div className="h-6 w-16 bg-muted animate-pulse rounded" />
        <div className="h-6 w-24 bg-muted animate-pulse rounded" />
      </div>
      {/* Button */}
      <div className="h-14 w-full bg-muted animate-pulse rounded-md mt-2" />
    </div>
  );
}
