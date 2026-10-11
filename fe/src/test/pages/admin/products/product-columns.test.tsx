import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createColumns } from "@/pages/admin/products/_components/column";

const rowValues: Record<string, string | number> = {
  Name: "Keyboard",
  ProductType: "KeyboardKit",
  SubType: "75",
  Color: "Black",
  Price: 125000,
  Stock: 7,
};

describe("admin product columns", () => {
  afterEach(() => cleanup());

  it("renders all headers and accessor cell values", () => {
    const columns = createColumns(vi.fn());
    const columnHeaders = columns
      .filter((column) => column.id !== "actions")
      .map((column) => column.header);
    const cells = columns
      .filter((column) => column.id !== "actions")
      .map((column) =>
        (column.cell as (context: never) => ReactNode)({
          row: {
            getValue: (key: string) => rowValues[key],
          },
        } as never),
      );
    const { container } = render(
      <>
        {columnHeaders.map((header, index) => (
          <div key={index}>
            {typeof header === "function"
              ? (header as () => ReactNode)()
              : header}
          </div>
        ))}
        {cells.map((cell, index) => <div key={index}>{cell}</div>)}
      </>,
    );

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Product Type")).toBeInTheDocument();
    expect(screen.getByText("Sub Type")).toBeInTheDocument();
    expect(screen.getByText("Variant")).toBeInTheDocument();
    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getByText("Stock")).toBeInTheDocument();
    expect(screen.getByText("Keyboard")).toBeInTheDocument();
    expect(screen.getByText("Keyboard Kit")).toBeInTheDocument();
    expect(screen.getByText("75% or less")).toBeInTheDocument();
    expect(screen.getByText("Black")).toBeInTheDocument();
    expect(screen.getByText("125.000")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });
});
