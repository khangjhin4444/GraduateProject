import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "@/pages/HasHeader/product";

vi.mock("@/pages/HasHeader/product/_components/ProductDetail", () => ({
  default: () => <div data-testid="product-detail">Product details</div>,
}));

vi.mock("@/pages/HasHeader/product/_components/ProductDetailSkeleton", () => ({
  default: () => <div data-testid="product-skeleton">Loading product</div>,
}));

describe("Product detail page", () => {
  it("renders the product detail component inside its suspense boundary", () => {
    render(<Page />);

    expect(screen.getByTestId("product-detail")).toBeInTheDocument();
    expect(screen.queryByTestId("product-skeleton")).not.toBeInTheDocument();
  });
});
