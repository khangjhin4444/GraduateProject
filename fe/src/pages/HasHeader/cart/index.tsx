import { useAppSelector } from "@/state/hooks";
import { Suspense } from "react";
import { Link } from "react-router";
import CartItemList from "./_components/CartItemList";

export default function Page() {
  const cartQuantity = useAppSelector((state) => state.profile.cartQuantity);
  return (
    <main className="px-8 md:px-10 min-h-screen">
      <h1 className="text-2xl font-bold">Your cart</h1>
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
        <Suspense fallback={<p>Loading...</p>}>
          <CartItemList />
        </Suspense>
      )}
    </main>
  );
}
