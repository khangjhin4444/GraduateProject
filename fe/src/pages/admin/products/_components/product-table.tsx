"use client";
import { createColumns } from "./column";
import { DataTable } from "./data-table";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import useAdminProductDetail from "@/hooks/useAdminProductDetail";
import { ProductFormDialog } from "./ProductFormDialog";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  EditProductFormDialog,
  type EditProductData,
} from "./EditProductFormDialog";

function TableSkeleton() {
  return (
    <div className="w-full space-y-4">
      {/* Header Skeleton (Tiêu đề & Nút Add) */}
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-8 w-50" />
        <Skeleton className="h-10 w-35" />
      </div>

      {/* Datatable Skeleton */}
      <div className="rounded-md border overflow-hidden">
        {/* Table Header (Hàng tiêu đề cột) */}
        <div className="border-b px-4 py-3 bg-muted/30 flex gap-4">
          <Skeleton className="h-5 w-1/5" />
          <Skeleton className="h-5 w-1/5" />
          <Skeleton className="h-5 w-1/5" />
          <Skeleton className="h-5 w-1/5" />
          <Skeleton className="h-5 w-1/5" />
        </div>

        {/* Table Body (Tạo 5 hàng giả lập) */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="px-4 py-4 border-b last:border-0 flex gap-4 items-center"
          >
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-4 w-1/5" />

            {/* Cột Action (mô phỏng 2 nút Edit & Delete) */}
            <div className="flex gap-2 w-1/5 justify-end">
              <Skeleton className="h-8 w-15" />
              <Skeleton className="h-8 w-17.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );
}

export default function ProductTable({ type }: { type: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editProductData, setEditProductData] =
    useState<EditProductData | null>(null);
  const qc = useQueryClient();
  const { ref, inView } = useInView({
    triggerOnce: true, // Chỉ kích hoạt 1 lần duy nhất khi nhìn thấy
    rootMargin: "300px 0px", // Khách cuộn gần tới nơi cách 200px là đã âm thầm load trước
  });
  const {
    data: products,
    isPending,
    fetchNextPage,
    isFetchingNextPage,
    isError,

    error,
  } = useAdminProductDetail({ type });

  const handleEdit = (productId: number) => {
    const allRows = products?.pages.flatMap((page) => page.data) ?? [];

    const matchingRows = allRows.filter((r) => r.ProductID === productId);

    if (matchingRows.length === 0) return;

    const first = matchingRows[0];
    const productData: EditProductData = {
      ProductID: first.ProductID,
      Name: first.Name,
      Description: first.Description,
      ProductType: first.ProductType,
      SubType: first.SubType,
      variants: matchingRows.map((r) => ({
        VariantID: r.VariantID,
        Color: r.Color,
        Price: r.Price,
        Stock: r.Stock,
        MainImage: r.MainImage,
      })),
      images: first.ExtraImages,
    };

    setEditProductData(productData);
    setEditDialogOpen(true);
  };

  const columns = createColumns(handleEdit);
  return (
    <div ref={ref}>
      {isError && <h1>{error.message}</h1>}
      {!inView || isPending ? (
        <TableSkeleton />
      ) : (
        <div>
          <div className="flex justify-between">
            <h2 className="font-bold text-xl mb-4">
              {type === "KeyboardKit" ? "Keyboard Kit" : type}
            </h2>

            <Button
              onClick={() => {
                setDialogOpen(true);
              }}
            >
              <span>
                <Plus />
              </span>
              Add Product
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={products?.pages.flatMap((page) => page.data) ?? []}
            fetchNextPage={fetchNextPage}
            hasNextPage={products?.pages.at(-1)?.hasNextPage ?? false}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      )}
      <ProductFormDialog
        key={Date()}
        initType={type}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={(type: string) => {
          qc.invalidateQueries({ queryKey: ["admin-products", type] });
        }}
      />
      {editProductData && (
        <EditProductFormDialog
          key={`edit-${editProductData.ProductID}`}
          productData={editProductData}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditProductData(null);
          }}
          onSaved={(type: string) => {
            qc.invalidateQueries({ queryKey: ["admin-products", type] });
          }}
        />
      )}
    </div>
  );
}
