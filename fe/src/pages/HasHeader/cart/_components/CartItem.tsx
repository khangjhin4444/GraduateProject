import { Checkbox } from "@/components/ui/checkbox";
import type { CartItemEntity } from "@/features/cart/schema/cart.schema";
import { useCartItem } from "@/hooks/useCartItem";
import { formatCurrency } from "@/utils/formatCurrency";
import { Minus, Plus, Trash2 } from "lucide-react";

export default function CartItem({
  item,
  handleToggleCheck,
}: {
  item: CartItemEntity & { isChecked: boolean };
  handleToggleCheck: (cartItemID: number) => void;
}) {
  const {
    quantityInput,
    canIncrease,
    canDecrease,
    isQuantityUpdating,
    handleQuantityChange,
    handleInputFocus,
    handleInputBlur,
    deleteItem,
  } = useCartItem(item);
  const currentStock = item.Stock;

  return (
    <div>
      <div className="w-full block sm:flex mb-5 p-4 border-border border rounded-2xl gap-4 shadow-lg relative min-h-60">
        {currentStock === 0 && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="border-4 border-accent/80 text-accent/80 text-2xl md:text-3xl font-bold uppercase tracking-widest px-6 py-2 rounded-xl rotate-[-10deg] bg-background/80 shadow-lg">
              Out of Stock
            </div>
          </div>
        )}
        <div className="block sm:flex-1 min-h-full w-full">
          <img
            src={item.MainImage}
            className="w-full h-full object-cover rounded-3xl"
          />
        </div>
        <div className="block sm:flex-2 mt-4 sm:mt-0 relative">
          <h2 className="font-semibold text-xl md:text-lg lg:text-xl mb-2">
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
          <p className="mt-5 text-foreground text-lg mb-5">
            Variant: {item.Color}
          </p>
          <div className="flex justify-center items-center w-1/2  border-2 border-border py-2 px-3 rounded-2xl ">
            <button
              aria-label="Decrease quantity"
              disabled={!canDecrease}
              onClick={() => handleQuantityChange("decrease")}
              className={`${canDecrease ? "cursor-pointer" : "cursor-not-allowed"} text-muted-foreground hover:text-foreground`}
            >
              <Minus />
            </button>
            <input
              type="number"
              max={currentStock}
              value={quantityInput}
              onFocus={handleInputFocus}
              onChange={(e) => handleQuantityChange("input", e.target.value)}
              onBlur={handleInputBlur}
              className="w-full text-center text-xl sm:text-lg select-none"
            />
            <button
              aria-label="Increase quantity"
              disabled={!canIncrease}
              onClick={() => handleQuantityChange("increase")}
              className={`${canIncrease ? "cursor-pointer" : "cursor-not-allowed"} text-muted-foreground hover:text-foreground`}
            >
              <Plus />
            </button>
          </div>
        </div>
        <div className="block sm:flex-1 ">
          <div className="flex sm:flex-col justify-between items-end h-full w-full flex-row-reverse mt-3 sm:mt-0">
            <div className="text-red-500 relative z-20">
              <button
                className="cursor-pointer flex gap-2 border-2 border-red-500 rounded-2xl p-2 sm:border-none sm:rounded-none sm:gap-0"
                disabled={isQuantityUpdating}
                onClick={deleteItem}
              >
                <Trash2 />
              </button>
            </div>
            <Checkbox
              className="sm:w-7 sm:h-7 border-2 border-border absolute sm:relative top-6 right-6 w-10 h-10"
              checked={item.isChecked}
              onClick={() => {
                handleToggleCheck(item.CartItemID);
              }}
            />
            <div>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(Number(item.Price))} EACH
              </span>
              <br />
              <div className="text-accent font-semibold text-right text-lg">
                {formatCurrency(Number(item.Price) * item.Quantity)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
