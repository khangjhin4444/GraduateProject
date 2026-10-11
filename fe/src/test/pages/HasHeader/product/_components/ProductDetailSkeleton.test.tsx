import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProductDetailSkeleton from "@/pages/HasHeader/product/_components/ProductDetailSkeleton";

describe("ProductDetailSkeleton", () => {
  it("renders the product detail loading layout", () => {
    const { container } = render(<ProductDetailSkeleton />);

    expect(container.querySelectorAll("section")).toHaveLength(2);
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(28);
    expect(screen.queryByText("ADD TO CART")).not.toBeInTheDocument();
  });
});
