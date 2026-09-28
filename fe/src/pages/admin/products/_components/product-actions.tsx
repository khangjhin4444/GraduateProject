import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminProductEntity } from "@/features/admin/schema/admin.schema";

function DeleteButton() {
  const [isConfirming, setIsConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = () => {
    if (isConfirming) {
      setIsConfirming(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    setIsConfirming(true);
    timerRef.current = setTimeout(() => setIsConfirming(false), 3000);
  };

  return (
    <Button
      type="button"
      size="icon-sm"
      variant={isConfirming ? "destructive" : "ghost"}
      aria-label={isConfirming ? "Confirm delete" : "Delete product"}
      title={isConfirming ? "Click again to confirm" : "Delete product"}
      onClick={handleClick}
    >
      <Trash2 />
    </Button>
  );
}

export function ProductActions({
  row,
  onEdit,
}: {
  row: AdminProductEntity;
  onEdit: (productId: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label="Edit product"
        title="Edit product"
        onClick={() => {
          onEdit(row.ProductID);
        }}
        className="cursor-pointer"
      >
        <Pencil />
      </Button>

      <DeleteButton />
    </div>
  );
}
