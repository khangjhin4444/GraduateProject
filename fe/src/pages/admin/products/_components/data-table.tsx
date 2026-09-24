"use client";

import { useState } from "react";
import {
  useTable,
  type ColumnDef,
  type PaginationState,
  type RowData,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { features, type DataTableFeatures } from "./data-table-features";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: DataTableProps<TData>) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const table = useTable({
    features,
    data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
  });
  const pageIndex = pagination.pageIndex;
  const pageCount = table.getPageCount();

  const loadNextPageIfNeeded = (nextPageIndex: number) => {
    const isOnLastLoadedPage = nextPageIndex >= pageCount - 1;
    if (isOnLastLoadedPage && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        {isFetchingNextPage && (
          <span className="text-sm text-muted-foreground mr-4 flex items-center gap-2">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading more...
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const nextPageIndex = pageIndex + 1;
            const canMoveToLoadedPage = nextPageIndex < pageCount;

            if (canMoveToLoadedPage) {
              table.nextPage();
              loadNextPageIfNeeded(nextPageIndex);
              return;
            }

            if (hasNextPage && !isFetchingNextPage) {
              await fetchNextPage();
              setPagination((current) => ({
                ...current,
                pageIndex: current.pageIndex + 1,
              }));
            }
          }}
          disabled={!table.getCanNextPage() && !hasNextPage}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
