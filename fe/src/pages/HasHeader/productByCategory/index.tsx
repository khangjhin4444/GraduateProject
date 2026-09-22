import { useLoaderData } from "react-router";

import ProductSection from "./_components/ProductSection";
type CategoryLoaderData = {
  type: string;
  sub?: string;
};

export default function Page() {
  const { type, sub } = useLoaderData() as CategoryLoaderData;
  return (
    <main className="p-6 w-full">
      <ProductSection key={`${type}:${sub ?? ""}`} type={type} sub={sub} />
    </main>
  );
}
