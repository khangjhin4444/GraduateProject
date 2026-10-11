import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ProductSkeleton from "@/shared/components/ProductSkeleton";

describe("ProductSkeleton", () => {
  it("show skeleton container", () => {
    render(<ProductSkeleton />);

    const skeletonContainer = screen.getByTestId("skeleton-container");

    expect(skeletonContainer).toBeInTheDocument();
    expect(skeletonContainer.childNodes).toHaveLength(8);
  });
});
