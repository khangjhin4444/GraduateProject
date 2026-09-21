import { Suspense } from "react";
import { useLoaderData } from "react-router";
import ProductByCategory from "./_components/ProductByCategory";

type CategoryLoaderData = {
  type: string;
  sub?: string;
};

export default function Page() {
  const { type, sub } = useLoaderData() as CategoryLoaderData;

  return (
    <Suspense fallback={<div>Loading Product...</div>}>
      <ProductByCategory type={type} sub={sub}></ProductByCategory>
    </Suspense>
  );
}
