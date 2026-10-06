import type { OrderItemEntity } from "@/features/order/schema/order.schema";
import { formatCurrency } from "@/utils/formatCurrency";
// import { formatSubtype } from "@/utils/formatSubtype";

export default function ItemCard({ item }: { item: OrderItemEntity }) {
  return (
    <div className="lg:flex items-center border-b pb-2 mb-3">
      <div className="flex gap-5 flex-3">
        <img
          src={item.MainImage}
          alt=""
          className="w-1/2 md:w-1/4 object-cover aspect-square rounded-3xl"
        />
        <div className="flex flex-col">
          <h2 className="font-semibold text-lg md:text-xl  mb-1">
            {item.Name}
          </h2>
          <p className="mt-2 text-muted-foreground text-md mb-3 ">
            Variant: {item.Color}
          </p>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-sm">
            {formatCurrency(Number(item.Price))} x {item.Quantity}
          </p>
          <p className="font-semibold mt-auto text-lg lg:hidden ">
            {formatCurrency(Number(item.Price) * item.Quantity)}
          </p>
        </div>
      </div>
      <div className="hidden lg:block flex-1 font-semibold text-md">
        {formatCurrency(Number(item.Price) * item.Quantity)}
      </div>
    </div>
  );
}
