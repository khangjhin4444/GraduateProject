import { Suspense } from "react";
import ProductDetail from "./_components/ProductDetail";
import ProductDetailSkeleton from "./_components/ProductDetailSkeleton";

export default function Page() {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetail></ProductDetail>
    </Suspense>
  );
}
