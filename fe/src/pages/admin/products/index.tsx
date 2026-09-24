import ProductTable from "./_components/product-table";

export default function Page() {
  return (
    <div className="flex flex-col gap-8">
      <ProductTable type="KeyboardKit" />
      {/* <ProductTable type="Prebuild" />
      <ProductTable type="Keycap" />
      <ProductTable type="Switch" /> */}
    </div>
  );
}
