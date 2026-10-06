import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircleX, Package, RotateCwFadingClock, Truck } from "lucide-react";
import OrderList from "./_component/OrderList";

export default function Page() {
  return (
    <main className="px-8 mb-10 min-h-screen">
      <h1 className="text-foreground font-bold text-2xl ">My Orders</h1>
      <p className="text-muted-foreground ">
        Here is a summary of your current and past orders.
      </p>
      <section className="mt-7">
        <Tabs defaultValue="pending" className="w-full">
          <div className="w-full  overflow-x-auto scrollbar-none">
            <TabsList className="w-max">
              <TabsTrigger value="pending" className="cursor-pointer ">
                <RotateCwFadingClock />
                Pending
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="cursor-pointer ">
                <Package />
                Confirmed
              </TabsTrigger>
              <TabsTrigger value="delivered" className="cursor-pointer ">
                <Truck />
                Delivered
              </TabsTrigger>
              <TabsTrigger value="canceled" className="cursor-pointer ">
                <CircleX />
                Canceled
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="pending">
            <OrderList status="Pending" />
          </TabsContent>
          <TabsContent value="canceled">
            <OrderList status="Canceled" />
          </TabsContent>
          <TabsContent value="confirmed">
            <OrderList status="Confirmed" />
          </TabsContent>
          <TabsContent value="delivered">
            <OrderList status="Delivered" />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
