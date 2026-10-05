import { Suspense } from "react";
import CartItemList from "./_components/CartItemList";

export default function Page() {
  return (
    <main className="px-8 md:px-10 min-h-screen pb-10">
      <h1 className="text-2xl font-bold">Choose what to checkout</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <CartItemList />
      </Suspense>
    </main>
  );
}
