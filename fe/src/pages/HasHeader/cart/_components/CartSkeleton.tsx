import { Card } from "@/components/ui/card";

export default function CartSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton - Tương đương với phần text "You have X items..." */}
      <div className="flex justify-between items-center pb-2 border-b-2 mb-8">
        <div className="h-6 w-48 bg-muted rounded-md"></div>
      </div>

      <section className="mt-8 block xl:flex items-start gap-10 mb-10">
        {/* Cột trái: Danh sách Cart Item */}
        <div className="block xl:flex-2 w-full">
          {/* Lặp lại 2 items để tạo cảm giác giỏ hàng đang có đồ */}
          {[1, 2].map((i) => (
            <div
              key={i}
              className="w-full block sm:flex mb-5 p-4 border-border border rounded-2xl gap-4 shadow-lg min-h-60"
            >
              {/* Hình ảnh */}
              <div className="block sm:flex-1 min-h-full w-full h-48 sm:h-auto bg-muted rounded-3xl"></div>

              {/* Thông tin chi tiết */}
              <div className="block sm:flex-2 mt-4 sm:mt-0">
                <div className="h-6 w-3/4 bg-muted rounded-md mb-3"></div>
                <div className="flex gap-2 mb-5">
                  <div className="h-6 w-20 bg-muted rounded-3xl"></div>
                  <div className="h-6 w-24 bg-muted rounded-3xl"></div>
                </div>
                <div className="h-5 w-32 bg-muted rounded-md mb-5"></div>

                {/* Nút tăng giảm số lượng */}
                <div className="w-1/2 h-10 border-2 border-border py-2 px-3 rounded-2xl flex items-center justify-between">
                  <div className="h-4 w-4 bg-muted rounded-full"></div>
                  <div className="h-4 w-8 bg-muted rounded-sm"></div>
                  <div className="h-4 w-4 bg-muted rounded-full"></div>
                </div>
              </div>

              {/* Cột phải: Giá và hành động */}
              <div className="block sm:flex-1">
                <div className="flex sm:flex-col justify-between items-end h-full w-full flex-row-reverse mt-3 sm:mt-0">
                  <div className="h-10 w-10 bg-muted rounded-2xl sm:rounded-md"></div>
                  <div className="h-7 w-7 bg-muted rounded-sm absolute sm:relative top-6 right-6 sm:top-0 sm:right-0"></div>
                  <div className="flex flex-col items-end gap-2 mt-4">
                    <div className="h-4 w-16 bg-muted rounded-md"></div>
                    <div className="h-6 w-24 bg-muted rounded-md"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cột phải: Order Summary */}
        <div className="block xl:flex-1 xl:sticky top-50 w-full">
          <Card className="shadow-2xl px-4 py-5 bg-background w-full">
            <div className="border-b-2 border-b-border pb-4 mb-4">
              <div className="h-6 w-32 bg-muted rounded-md mb-4"></div>

              <div className="flex justify-between items-center mb-3">
                <div className="h-5 w-24 bg-muted rounded-md"></div>
                <div className="h-5 w-20 bg-muted rounded-md"></div>
              </div>

              <div className="flex justify-between items-center">
                <div className="h-5 w-20 bg-muted rounded-md"></div>
                <div className="h-5 w-32 bg-muted rounded-md"></div>
              </div>
            </div>

            <div className="flex justify-between mb-6">
              <div className="h-7 w-16 bg-muted rounded-md"></div>
              <div className="h-7 w-24 bg-muted rounded-md"></div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="h-14 w-full bg-muted rounded-lg"></div>
              <div className="h-14 w-full bg-muted rounded-lg"></div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
