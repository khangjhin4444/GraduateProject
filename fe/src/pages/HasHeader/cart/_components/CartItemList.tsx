import { useCart } from "@/hooks/useCart";
import { Link } from "react-router";
import CartItem from "./CartItem";
import { useState } from "react";
import OrderSummary from "./OrderSummary";
import { useAppSelector } from "@/state/hooks";
export default function CartItemList() {
  const { data: cart } = useCart();
  const [checkedOverrides, setCheckedOverrides] = useState<
    Record<number, boolean>
  >({});
  const [quantityOverrides, setQuantityOverrides] = useState<
    Record<number, number>
  >({});
  const selectedItems = cart.items.map((item) => {
    const Quantity = quantityOverrides[item.CartItemID] ?? item.Quantity;
    const isChecked =
      checkedOverrides[item.CartItemID] ?? item.Stock >= Quantity;
    return { ...item, Quantity, isChecked };
  });
  function handleToggleCheck(cartItemID: number) {
    const current = selectedItems.find((i) => i.CartItemID === cartItemID);
    setCheckedOverrides((prev) => ({
      ...prev,
      [cartItemID]: !current?.isChecked,
    }));
  }
  function handleQuantityChange(cartItemID: number, Quantity: number) {
    setQuantityOverrides((prev) => ({ ...prev, [cartItemID]: Quantity }));
  }
  const cartQuantity = useAppSelector((state) => state.profile.cartQuantity);
  console.log(cart);
  return (
    <div>
      <div className="flex justify-between items-center ">
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
              to="/collection/keyboardkit"
              className="mt-5 inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Browse products
            </Link>
          </div>
        </div>
      ) : (
        <section className="mt-10 block lg:flex items-start gap-10 mb-10">
          <div className="block lg:flex-2">
            {selectedItems.map((item) => (
              <CartItem
                item={item}
                key={item.CartItemID}
                handleToggleCheck={handleToggleCheck}
                handleQuantityChangeParent={handleQuantityChange}
              />
            ))}
          </div>
          <div className="block sm:flex-1 sm:sticky top-50">
            <OrderSummary selectedItems={selectedItems}></OrderSummary>
          </div>
        </section>
      )}
    </div>
  );
}
