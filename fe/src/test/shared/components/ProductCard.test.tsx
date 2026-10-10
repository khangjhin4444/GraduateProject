import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useNavigate } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductEntity } from "@/features/product/schema/product.schema";
import { ProductCard } from "@/shared/components/ProductCard";

vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useNavigate: vi.fn() };
});

const navigate = vi.fn();
const product: ProductEntity = {
  ProductID: 1,
  Name: "Keyboard 1",
  ProductType: "KeyboardKit",
  Description: { blocks: [] },
  SubType: "75%",
  variants: [
    { colorText: "Black", image: "/black.jpg", price: 100000 },
    { colorText: "White", image: "/white.jpg", price: 125000 },
  ],
};

describe("ProductCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(navigate);
  });

  afterEach(() => cleanup());

  it("shows the first variant's image and price by default", () => {
    render(<ProductCard product={product} />);

    expect(screen.getByRole("img", { name: "Keyboard 1" })).toHaveAttribute(
      "src",
      "/black.jpg",
    );
    expect(screen.getByText("100.000 VND")).toBeInTheDocument();
    expect(screen.getByText(/75% or less/)).toBeInTheDocument();
  });

  it("updates the displayed image and price when a variant is selected", async () => {
    const user = userEvent.setup();
    render(<ProductCard product={product} />);

    await user.click(screen.getByTitle("White"));

    expect(screen.getByRole("img", { name: "Keyboard 1" })).toHaveAttribute(
      "src",
      "/white.jpg",
    );
    expect(screen.getByText("125.000 VND")).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("navigates to the product when its image, name, or View More button is clicked", async () => {
    const user = userEvent.setup();
    render(<ProductCard product={product} />);

    await user.click(screen.getByRole("img", { name: "Keyboard 1" }));
    expect(navigate).toHaveBeenLastCalledWith("/product/1");

    await user.click(screen.getByText("Keyboard 1"));
    expect(navigate).toHaveBeenLastCalledWith("/product/1");

    await user.click(screen.getByRole("button", { name: "View More" }));
    expect(navigate).toHaveBeenLastCalledWith("/product/1");
    expect(navigate).toHaveBeenCalledTimes(3);
  });
});
