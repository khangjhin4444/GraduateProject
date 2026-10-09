import { cleanup, render, screen } from "@testing-library/react";
import { useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Page from "@/pages/HasHeader/checkout";

const routeState = vi.hoisted(() => ({
  current: { checkoutItems: [], isBuyNow: false } as {
    checkoutItems: { id: number; qty: number }[];
    isBuyNow: boolean;
  },
}));

vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useLocation: vi.fn(() => ({ state: routeState.current })),
    Navigate: ({ to, replace }: { to: string; replace?: boolean }) => (
      <div data-testid="navigate" data-to={to} data-replace={String(replace)} />
    ),
  };
});

vi.mock("@/pages/HasHeader/checkout/_components/CheckoutPage", () => ({
  default: ({
    checkoutItems,
    isBuyNow,
  }: {
    checkoutItems: { id: number; qty: number }[];
    isBuyNow: boolean;
  }) => (
    <div data-testid="checkout-page">
      {JSON.stringify({ checkoutItems, isBuyNow })}
    </div>
  ),
}));

describe("Checkout page", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    routeState.current = { checkoutItems: [], isBuyNow: false };
    vi.mocked(useLocation).mockReturnValue({
      state: routeState.current,
    } as ReturnType<typeof useLocation>);
  });

  it("redirects to the cart if no items were passed in route state", () => {
    render(<Page />);

    expect(screen.getByTestId("navigate")).toHaveAttribute("data-to", "/cart");
    expect(screen.getByTestId("navigate")).toHaveAttribute(
      "data-replace",
      "true",
    );
  });

  it("passes checkout items and buy-now state to checkout", () => {
    routeState.current = {
      checkoutItems: [{ id: 42, qty: 2 }],
      isBuyNow: true,
    };
    vi.mocked(useLocation).mockReturnValue({
      state: routeState.current,
    } as ReturnType<typeof useLocation>);

    render(<Page />);

    expect(screen.getByTestId("checkout-page")).toHaveTextContent(
      JSON.stringify({
        checkoutItems: [{ id: 42, qty: 2 }],
        isBuyNow: true,
      }),
    );
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });
});
