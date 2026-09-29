import { useCart } from "@/hooks/useCart";
import { Minus, Plus } from "lucide-react";
import { Link } from "react-router";
export default function CartItemList() {
  const { data: cart } = useCart();
  const cartQuantity = cart.items.reduce(
    (total, item) => total + item.Quantity,
    0,
  );
  console.log(cart);
  return (
    <div>
      <div className="flex justify-between items-center">
        <p>
          You have {cartQuantity} {cartQuantity > 1 ? "items" : "item"} to
          checkout
        </p>
        <button
          className="text-muted-foreground cursor-pointer disabled:cursor-not-allowed"
          disabled={cartQuantity === 0}
        >
          Clear cart
        </button>
      </div>

      {cartQuantity == 0 ? (
        <div className="mt-8 grid min-h-72 place-items-center rounded-xl border border-dashed border-border text-center">
          <div>
            <p className="font-display text-lg font-semibold">
              Your cart is empty
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse the catalog and add something you like.
            </p>
            <Link
              to="/collection"
              className="mt-5 inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Browse products
            </Link>
          </div>
        </div>
      ) : (
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
                  <p className="mt-5 text-foreground mb-5">
                    Variant: {item.Color}
                  </p>
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
      )}
    </div>
  );
}
