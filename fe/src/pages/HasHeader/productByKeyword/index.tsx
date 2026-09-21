import { Suspense } from "react";
import { useLoaderData } from "react-router";
import ProductByKeyword from "./_components/ProductByKeyword";

export default function Page() {
  const { keyword } = useLoaderData();

  return (
    <Suspense fallback={<div>Loading Product...</div>}>
      <ProductByKeyword keyword={keyword}></ProductByKeyword>
    </Suspense>
  );
}
