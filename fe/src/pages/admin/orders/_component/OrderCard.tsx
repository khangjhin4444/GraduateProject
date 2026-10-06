import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { OrderEntity } from "@/features/order/schema/order.schema";
import { formatDateTime } from "@/utils/formatDateTime";
import { getClassTextByStatus } from "@/utils/getClassTextByStatus";
import { getIconByStatus } from "@/utils/getIconByStatus";
import OrderItemCard from "@/shared/components/OrderItemCard";
import OrderInformation from "./OrderInformation";

export default function OrderCard({ order }: { order: OrderEntity }) {
  return (
    <Card className="w-full bg-card text-card-foreground mb-5 gap-0! pb-0!">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-lg">
            #JK{order.OrderID}{" "}
            <span className="ml-2 text-muted-foreground text-sm font-normal">
              {formatDateTime(order.Date)}, {order.items.length}{" "}
              {order.items.length > 1 ? "items" : "item"}
            </span>
          </p>
          <div
            className={`flex items-center gap-2 text-xs md:text-sm  px-2 py-1 rounded-2xl ${getClassTextByStatus(order.Status)}`}
          >
            {getIconByStatus(order.Status)} {order.Status}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0!">
        <div className="grid grid-cols-1 md:grid-cols-3">
          <div className="col-span-1 md:col-span-2 relative  md:h-auto md:border-r">
            <div className="md:absolute md:inset-0 overflow-y-auto scrollbar-none p-3">
              {order.items.map((item) => {
                return <OrderItemCard item={item} key={item.OrderItemID} />;
              })}
            </div>
          </div>
          <div className="col-span-1 p-5 border-t mt-3 md:mt-0 md:border-none">
            <OrderInformation order={order} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
