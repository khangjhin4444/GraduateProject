import { Card } from "@/components/ui/card";
import { HandCoins, MapPinHouse, Truck } from "lucide-react";

export default function CheckoutSkeleton() {
  return (
    <div className="animate-pulse">
      <section className="xl:flex xl:gap-10 mt-5">
        {/* Cột trái: Order Form Skeleton */}
        <div className="xl:flex-2 w-full">
          {/* Step 1: Contact and Delivery */}
          <div className="mt-7">
            <div className="flex items-center gap-5 border-b pb-2 mb-5">
              <div className="bg-muted p-2 rounded-lg h-10 w-10 flex items-center justify-center">
                <MapPinHouse className="text-muted-foreground/50" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-16 bg-muted rounded"></div>
                <div className="h-6 w-48 bg-muted rounded"></div>
              </div>
            </div>

            <div className="block md:flex gap-6 mb-5">
              <div className="w-full space-y-2 mb-5 md:mb-0">
                <div className="h-4 w-24 bg-muted rounded"></div>
                <div className="h-14 w-full bg-muted rounded-md border border-border"></div>
              </div>
              <div className="w-full space-y-2">
                <div className="h-4 w-32 bg-muted rounded"></div>
                <div className="h-14 w-full bg-muted rounded-md border border-border"></div>
              </div>
            </div>

            <div className="mb-5 space-y-2">
              <div className="h-4 w-32 bg-muted rounded"></div>
              <div className="h-14 w-full bg-muted rounded-md border border-border"></div>
            </div>

            <div className="mb-5 space-y-2">
              <div className="h-4 w-40 bg-muted rounded"></div>
              <div className="h-24 w-full bg-muted rounded-md border border-border"></div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-5 w-5 bg-muted rounded border border-border"></div>
              <div className="h-4 w-48 bg-muted rounded"></div>
            </div>
          </div>

          {/* Step 2: Shipping Method */}
          <div className="flex items-center gap-5 border-b pb-2 mb-5 mt-10">
            <div className="bg-muted p-2 rounded-lg h-10 w-10 flex items-center justify-center">
              <Truck className="text-muted-foreground/50" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-muted rounded"></div>
              <div className="h-6 w-40 bg-muted rounded"></div>
            </div>
          </div>
          <div className="md:flex gap-4 mb-5">
            <div className="w-full h-20 bg-muted rounded-lg border border-border mb-4 md:mb-0"></div>
            <div className="w-full h-20 bg-muted rounded-lg border border-border"></div>
          </div>

          {/* Step 3: Payment Method */}
          <div className="flex items-center gap-5 border-b pb-2 mb-5 mt-10">
            <div className="bg-muted p-2 rounded-lg h-10 w-10 flex items-center justify-center">
              <HandCoins className="text-muted-foreground/50" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-muted rounded"></div>
              <div className="h-6 w-40 bg-muted rounded"></div>
            </div>
          </div>
          <div className="md:flex gap-4 mb-10">
            <div className="w-full h-20 bg-muted rounded-lg border border-border mb-4 md:mb-0"></div>
            <div className="w-full h-20 bg-muted rounded-lg border border-border"></div>
          </div>
        </div>

        {/* Cột phải: Order Summary Skeleton */}
        <div className="block xl:flex-1 xl:sticky top-32 h-fit w-full">
          <Card className="shadow-2xl px-4 py-5 bg-background w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-32 bg-muted rounded"></div>
              <div className="h-5 w-16 bg-muted rounded"></div>
            </div>

            <div className="py-2 border-b-2 mb-4 space-y-5">
              {/* Lặp lại 2 items ảo */}
              {[1, 2].map((i) => (
                <div className="flex gap-4" key={i}>
                  <div className="h-20 w-20 md:w-24 xl:w-20 bg-muted rounded-2xl"></div>
                  <div className="flex flex-col flex-1 py-1">
                    <div className="h-5 w-3/4 bg-muted rounded mb-2"></div>
                    <div className="h-4 w-1/2 bg-muted rounded mb-auto"></div>
                    <div className="h-5 w-24 bg-muted rounded mt-2"></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-b-2 pb-4 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 w-20 bg-muted rounded"></div>
                <div className="h-5 w-24 bg-muted rounded"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-5 w-20 bg-muted rounded"></div>
                <div className="h-5 w-24 bg-muted rounded"></div>
              </div>
            </div>

            <div className="flex justify-between mb-6">
              <div className="h-7 w-16 bg-muted rounded"></div>
              <div className="h-7 w-32 bg-muted rounded"></div>
            </div>

            <div className="h-16 w-full bg-muted rounded-md mb-4"></div>
            <div className="h-6 w-32 bg-muted rounded mx-auto mt-2"></div>
          </Card>
        </div>
      </section>
    </div>
  );
}
