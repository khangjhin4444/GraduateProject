import type { ProductEntity } from "@/features/product/schema/product.schema";
import { ProductCard } from "@/shared/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";

export default function ProductTab({
  products,
  link,
}: {
  products: ProductEntity[];
  link: string;
}) {
  const navigate = useNavigate();
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 gap-y-6">
        {products.map((product) => (
          <ProductCard product={product} key={product.ProductID}></ProductCard>
        ))}
      </div>
      <div className="flex justify-center mt-5">
        <Button
          className=" cursor-pointer group relative isolate overflow-hidden bg-background border-primary border-2 text-primary text-lg px-6 py-3 hover:bg-background hover:text-primary-foreground before:absolute before:inset-0 before:-z-10 before:origin-left before:scale-x-0 before:bg-primary before:transition-transform before:duration-300 before:ease-out hover:before:scale-x-100"
          onClick={() => navigate(link)}
        >
          <span className="relative z-10">View All</span>
          <ChevronRight className="relative z-10" />
        </Button>
      </div>
    </div>
  );
}
