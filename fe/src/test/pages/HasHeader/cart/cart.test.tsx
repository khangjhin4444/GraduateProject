import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "@/pages/HasHeader/cart";

vi.mock("@/pages/HasHeader/cart/_components/CartItemList", () => ({
  default: () => <div data-testid="cart-items">Cart items</div>,
}));

vi.mock("@/pages/HasHeader/cart/_components/CartSkeleton", () => ({
  default: () => <div data-testid="cart-skeleton">Loading cart</div>,
}));

describe("Cart page", () => {
  it("renders the checkout heading and cart items", () => {
    render(<Page />);

    expect(
      screen.getByRole("heading", { name: "Choose what to checkout" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("cart-items")).toBeInTheDocument();
    expect(screen.queryByTestId("cart-skeleton")).not.toBeInTheDocument();
  });
});
