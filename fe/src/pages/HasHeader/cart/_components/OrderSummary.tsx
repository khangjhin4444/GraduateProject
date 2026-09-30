import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CartItemEntity } from "@/features/cart/schema/cart.schema";
import { formatCurrency } from "@/utils/formatCurrency";
import { useNavigate } from "react-router";

export default function OrderSummary({
  selectedItems,
}: {
  selectedItems: Array<CartItemEntity & { isChecked: boolean }>;
}) {
  const navigate = useNavigate();
  const count = selectedItems.reduce(
    (count, item) => (item.isChecked ? count + item.Quantity : count),
    0,
  );
  const Subtotal = selectedItems.reduce(
    (total, item) =>
      item.isChecked ? total + Number(item.Price) * item.Quantity : total,
    0,
  );
  return (
    <Card className="shadow-2xl px-4 py-5 bg-background w-full">
      <div className="border-b-2 border-b-border pb-4">
        <h2 className="text-lg font-semibold mb-2">Order Summary</h2>
        <div className="flex justify-between items-center mb-3">
          <p className="text-muted-foreground">
            Subtotal {`(${count} ${count > 1 ? "items" : "item"})`}
          </p>
          <span className="text-foreground font-medium text-lg">
            {formatCurrency(Subtotal)}
          </span>
        </div>
        <div className="flex justify-between items-center text-muted-foreground">
          <p>Shipping</p>
          <p>Calculated at checkout</p>
        </div>
      </div>
      <div className="flex justify-between">
        <p className="text-foreground font-semibold text-xl">Total</p>
        <p className="text-accent text-xl font-semibold">
          {formatCurrency(Subtotal)}
        </p>
      </div>
      <Button
        className="py-7 text-xl bg-primary text-primary-foreground cursor-pointer hover:zoom-105"
        disabled={count === 0}
      >
        Proceed to Checkout
      </Button>
      <Button
        className="py-7 text-xl bg-muted text-muted-foreground hover:bg-mute-foreground hover:text-foreground cursor-pointer hover:zoom-105"
        onClick={() => navigate("/collection/keyboardkit")}
      >
        Continue Shopping
      </Button>
    </Card>
  );
}
