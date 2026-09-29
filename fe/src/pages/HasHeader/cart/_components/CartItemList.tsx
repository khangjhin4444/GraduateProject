import { useCart } from "@/hooks/useCart";
import { Minus, Plus } from "lucide-react";

export default function CartItemList() {
  const { data: cart } = useCart();
  console.log(cart);
  return (
    <section className="mt-10 block lg:flex items-start gap-10">
      <div className="block lg:flex-2">
        {cart.items.map((item, index) => (
          <div
            key={index}
            className="w-full block sm:flex mb-5 p-4 border-border border rounded-2xl sm:h-50 gap-10"
          >
            <div className="block sm:flex-1 h-full">
              <img
                src={item.MainImage}
                className="w-full h-full object-cover rounded-3xl"
              />
            </div>
            <div className="block sm:flex-2">
              <h2 className="font-semibold text-md md:text-lg lg:text-xl mb-2">
                {item.Name}
              </h2>
              <div>
                <span className="bg-muted px-4 py-1 rounded-3xl text-muted-foreground mr-2 text-sm">
                  {item.ProductType}
                </span>
                <span className="bg-muted px-4 py-1 rounded-3xl text-muted-foreground text-sm">
                  {item.SubType}
                </span>
              </div>
              <p className="mt-5 text-foreground mb-5">Variant: {item.Color}</p>
              <div className="flex w-full sm:w-1/3 border-2 border-border py-2 px-3 rounded-2xl ">
                <Minus />
                <input type="number" className="w-full" />
                <Plus />
              </div>
            </div>
            <div className="block sm:flex-1">sdsdsd</div>
          </div>
        ))}
      </div>
      <div className="block sm:flex-1">checkout</div>
    </section>
  );
}
