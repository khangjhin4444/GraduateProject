import { useEffect, useRef, useState } from "react";
import ProductSkeleton from "@/shared/components/ProductSkeleton";
import { ProductCard } from "@/shared/components/ProductCard";
import ProductPagination from "@/shared/components/ProductPagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useSearchProducts from "@/hooks/useSearchProducts";
const sortOtps = [
  { label: "Price Increase", value: "price-asc" },
  { label: "Price Decrease", value: "price-desc" },
  { label: "A - Z", value: "name-asc" },
  { label: "Z - A", value: "name-desc" },
  { label: "Default", value: "default" },
];

export default function SearchProductSection({ keyword }: { keyword: string }) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("default");
  const sectionRef = useRef<HTMLElement>(null);
  const shouldScrollAfterPageChange = useRef(false);
  const { data, isPending, isError, error } = useSearchProducts({
    keyword,
    page,
    sort,
  });
  const products = data?.pages.flatMap((page) => page.products) ?? [];
  const totalPages = data?.pages.at(-1)?.totalPages ?? 0;
  const showPagination =
    !isPending && !isError && products.length > 0 && totalPages > 1;

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(1);
  };

  useEffect(() => {
    if (!shouldScrollAfterPageChange.current || isPending || isError) return;

    shouldScrollAfterPageChange.current = false;
    sectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [page, isPending, isError]);

  const changePage = (nextPage: number) => {
    shouldScrollAfterPageChange.current = true;
    setPage(nextPage);
  };

  return (
    <main className="px-6 w-full">
      <section
        ref={sectionRef}
        className="flex flex-col mt-2 min-h-screen p-4 w-full scroll-mt-32"
      >
        <div className="flex flex-col md:flex-row items-center justify-between w-full mb-5 gap-2">
          <h1 className="text-2xl font-semibold flex items-center gap-2 justify-center">
            Search Result
          </h1>
          <div className="flex items-center gap-2">
            <p>Sort by: </p>
            <Select
              items={sortOtps}
              onValueChange={(value: string | null) => handleSortChange(value!)}
              disabled={products.length === 0}
            >
              <SelectTrigger className="w-45">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {sortOtps.map((otp) => (
                    <SelectItem key={otp.value} value={otp.value}>
                      {otp.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        {isPending && <ProductSkeleton />}
        {isError && (
          <p role="alert">
            {error instanceof Error
              ? error.message
              : "Cannot load Keyboard Kit products."}
          </p>
        )}
        {!isPending && !isError && products.length === 0 && (
          <div className="flex w-full justify-center mt-10  font-bold text-2xl text-red-500">
            <p>No products found with keyword "{keyword}"!</p>
          </div>
        )}
        {!isPending && !isError && products.length > 0 && (
          <div className="w-full">
            <div className="grid grid-cols-1 gap-4 gap-y-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard product={product} key={product.ProductID} />
              ))}
            </div>
            {showPagination && (
              <ProductPagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={changePage}
              />
            )}
          </div>
        )}
      </section>
    </main>
  );
}
