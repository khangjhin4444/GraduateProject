import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import useProducts from "@/hooks/useProducts";
import ProductSkeleton from "@/shared/components/ProductSkeleton";
import { formatRequest } from "@/utils/formatRequest";
import { ProductCard } from "@/shared/components/ProductCard";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatSubtype } from "@/utils/formatSubtype";
import { Dot } from "lucide-react";
const sortOtps = [
  { label: "Price Increase", value: "price-asc" },
  { label: "Price Decrease", value: "price-desc" },
  { label: "A - Z", value: "name-asc" },
  { label: "Z - A", value: "name-desc" },
  { label: "Default", value: "default" },
];

export default function ProductSection({
  type,
  sub,
}: {
  type: string;
  sub?: string;
}) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("default");
  const sectionRef = useRef<HTMLElement>(null);
  const shouldScrollAfterPageChange = useRef(false);
  const { data, isPending, isError, error } = useProducts({
    type: formatRequest(type),
    sub: sub ? formatRequest(sub) : undefined,
    sort,
    page,
    limit: 8,
  });
  const products = data?.pages.flatMap((page) => page.data) ?? [];
  const hasNextPage = data?.pages.at(-1)?.hasNextPage ?? false;
  const showPagination =
    !isPending && !isError && products.length > 0 && (page > 1 || hasNextPage);

  const handleSortChange = (value: unknown) => {
    if (typeof value === "string") {
      setSort(value);
      setPage(1);
    }
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
    <section
      ref={sectionRef}
      className="flex flex-col justify-center p-4 w-full scroll-mt-32"
    >
      <div className="flex flex-col md:flex-row items-center justify-between w-full mb-5 gap-2">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          {type && formatSubtype(type)}
          {sub && <Dot />}{" "}
          {sub && (
            <span className="text-muted-foreground font-semibold">
              {formatSubtype(sub)}
            </span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          <p>Sort by: </p>
          <Select items={sortOtps} onValueChange={handleSortChange}>
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
        <div className="flex w-full justify-center mt-10 text-foreground font-bold text-2xl">
          <p>No products found!</p>
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
            <nav
              aria-label="Product pagination"
              className="mt-6 flex justify-end gap-2"
            >
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous page"
                disabled={page === 1}
                onClick={() => changePage(page - 1)}
              >
                <ChevronLeft />
              </Button>
              <span
                className="flex min-w-10 items-center justify-center text-sm font-medium"
                aria-current="page"
              >
                {page}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next page"
                disabled={!hasNextPage}
                onClick={() => changePage(page + 1)}
                className={
                  !hasNextPage ? "cursor-not-allowed" : "cursor-pointer"
                }
              >
                <ChevronRight />
              </Button>
            </nav>
          )}
        </div>
      )}
    </section>
  );
}
