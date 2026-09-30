import { createColumnHelper } from "@tanstack/react-table";
import { type DataTableFeatures } from "./data-table-features";
import { type AdminProductEntity } from "@/features/admin/schema/admin.schema";
import { ProductActions } from "./product-actions";
import { formatSubtype } from "@/utils/formatSubtype";

const priceFormatter = new Intl.NumberFormat("vi-VN");

const columnHelper = createColumnHelper<
  DataTableFeatures,
  AdminProductEntity
>();

export const createColumns = (onEdit: (productId: number) => void) =>
  columnHelper.columns([
    columnHelper.accessor("Name", {
      size: 250,
      header: () => <div className="text-left font-semibold text-md">Name</div>,
      cell: ({ row }) => {
        return (
          <div className="min-w-0 whitespace-normal break-all text-left font-medium text-sm md:text-md">
            {row.getValue("Name")}
          </div>
        );
      },
    }),
    columnHelper.accessor("ProductType", {
      size: 100,
      header: () => (
        <div className="text-left font-semibold text-md">Product Type</div>
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left font-normal text-sm md:text-md">
            {formatSubtype(row.getValue("ProductType"))}
          </div>
        );
      },
    }),
    columnHelper.accessor("SubType", {
      size: 130,
      header: () => (
        <div className="text-left font-semibold text-md">Sub Type</div>
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left font-normal text-sm md:text-md">
            {formatSubtype(row.getValue("SubType"))}
          </div>
        );
      },
    }),
    columnHelper.accessor("Color", {
      size: 100,
      header: () => (
        <div className="text-left font-semibold text-md">Variant</div>
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left font-normal text-sm md:text-md">
            {row.getValue("Color")}
          </div>
        );
      },
    }),
    columnHelper.accessor("Price", {
      size: 140,
      header: () => (
        <div className="text-right font-semibold text-md">Price</div>
      ),
      cell: ({ row }) => {
        return (
          <div className="text-right font-semibold text-sm md:text-md">
            {priceFormatter.format(row.getValue<number>("Price"))}
          </div>
        );
      },
    }),
    columnHelper.accessor("Stock", {
      size: 80,
      header: () => (
        <div className="text-right font-semibold text-md">Stock</div>
      ),
      cell: ({ row }) => {
        return (
          <div className="text-right font-semibold text-sm md:text-md">
            {row.getValue("Stock")}
          </div>
        );
      },
    }),
    {
      id: "actions",
      size: 100,
      cell: ({ row }) => <ProductActions row={row.original} onEdit={onEdit} />,
    },
  ]);
