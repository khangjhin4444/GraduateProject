import { Minus, Plus } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
interface QuantityProps {
  quantity: number;
  currentStock: number;
  setQuantity: Dispatch<SetStateAction<number>>;
}

export default function Quantity({
  quantity,
  currentStock,
  setQuantity,
}: QuantityProps) {
  const handleQuantityChange = (
    type: "decrease" | "increase" | "input",
    value?: string | number,
  ) => {
    if (type === "decrease") {
      setQuantity((prev) => Math.max(1, (Number(prev) || 1) - 1));
    }
    if (type === "increase") {
      setQuantity((prev) => {
        const current = Number(prev) || 1;
        return current < currentStock ? current + 1 : currentStock;
      });
    }
    if (type === "input" && value !== undefined) {
      if (value === "") {
        setQuantity(0);
        return;
      }
      const numValue = parseInt(value.toString(), 10);
      if (isNaN(numValue)) return;
      if (numValue <= currentStock) {
        setQuantity(numValue);
      } else {
        setQuantity(currentStock);
      }
    }
  };
  return (
    <div className="flex items-center mb-10">
      <div className="mr-10 text-2xl">Quantity:</div>
      <div className="flex items-center overflow-hidden">
        <button
          onClick={() => handleQuantityChange("decrease")}
          className="px-4 py-2 cursor-pointer  text-5xl text-muted-foreground hover:text-foreground"
        >
          <Minus />
        </button>
        <input
          type="number"
          max={currentStock}
          value={quantity}
          onChange={(e) => handleQuantityChange("input", e.target.value)}
          onBlur={() => {
            if (!quantity || Number(quantity) < 1) {
              setQuantity(1);
            }
          }}
          className="w-20 text-center  outline-none py-2 text-2xl"
        />
        <button
          onClick={() => handleQuantityChange("increase")}
          className="px-4 py-2 cursor-pointer text-5xl text-muted-foreground hover:text-foreground"
        >
          <Plus />
        </button>
      </div>
    </div>
  );
}
