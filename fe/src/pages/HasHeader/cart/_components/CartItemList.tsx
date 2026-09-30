import { useCart } from "@/hooks/useCart";
import { Link } from "react-router";
import CartItem from "./CartItem";
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
        <section className="mt-10 block lg:flex items-start gap-10 mb-10">
          <div className="block lg:flex-2">
            {cart.items.map((item) => (
              <CartItem item={item} key={item.CartItemID} />
            ))}
          </div>
          <div className="block sm:flex-1">checkout</div>
        </section>
      )}
    </div>
  );
}
