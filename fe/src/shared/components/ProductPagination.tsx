import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type PageItem =
  | { type: "page"; page: number }
  | { type: "ellipsis"; key: string };

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 3) {
    return Array.from({ length: totalPages }, (_, index) => ({
      type: "page",
      page: index + 1,
    }));
  }

  let visiblePages: number[];
  if (currentPage <= 2) {
    visiblePages = [1, 2, 3];
  } else if (currentPage >= totalPages - 2) {
    visiblePages = [totalPages - 2, totalPages - 1, totalPages];
  } else {
    visiblePages = [currentPage - 1, currentPage, currentPage + 1];
  }

  const pages = [...new Set([1, ...visiblePages, totalPages])].sort(
    (left, right) => left - right,
  );
  const items: PageItem[] = [];
  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index]!;
    items.push({ type: "page", page });
    const nextPage = pages[index + 1];
    if (nextPage === undefined) continue;

    const gap = nextPage - page;
    if (gap > 1) {
      items.push({ type: "ellipsis", key: `ellipsis-${page}` });
    }
  }

  return items;
}

export default function ProductPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Product pagination"
      className="mt-6 flex justify-end gap-2"
    >
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous page"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft />
      </Button>
      {getPageItems(currentPage, totalPages).map((item) =>
        item.type === "ellipsis" ? (
          <span
            key={item.key}
            aria-hidden="true"
            className="flex size-8 items-center justify-center"
          >
            …
          </span>
        ) : (
          <Button
            key={item.page}
            variant={item.page === currentPage ? "default" : "outline"}
            size="icon"
            aria-label={`Page ${item.page}`}
            aria-current={item.page === currentPage ? "page" : undefined}
            disabled={item.page === currentPage}
            onClick={() => onPageChange(item.page)}
          >
            {item.page}
          </Button>
        ),
      )}
      <Button
        variant="outline"
        size="icon"
        aria-label="Next page"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight />
      </Button>
    </nav>
  );
}
