import { Suspense } from "react";
import ProductDetail from "./_components/ProductDetail";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading Product...</div>}>
      <ProductDetail></ProductDetail>
    </Suspense>
  );
}
