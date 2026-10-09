import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useNavigate } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import OrderSummary from "@/pages/HasHeader/checkout/_components/OrderSummary";

vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useNavigate: vi.fn() };
});

describe("Checkout OrderSummary", () => {
  afterEach(() => cleanup());

  it("calculates item totals and disables order placement while pending", () => {
    vi.mocked(useNavigate).mockReturnValue(vi.fn());
    const placeOrderMutation = { isPending: true } as never;
    const items = [
      {
        VariantID: 1,
        Name: "Keyboard",
        ProductType: "KeyboardKit",
        SubType: "75%",
        Color: "Black",
        MainImage: "/keyboard.jpg",
        Price: "100000",
        Quantity: 2,
      },
    ];

    render(
      <OrderSummary
        subTotal={200000}
        items={items}
        count={2}
        shipping={40}
        placeOrderMutation={placeOrderMutation}
      />,
    );

    expect(screen.getByText("Keyboard")).toBeInTheDocument();
    expect(screen.getByText("40.000 VND")).toBeInTheDocument();
    expect(screen.getByText("240.000 VND")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Placing Order" }),
    ).toBeDisabled();
  });

  it("returns to the cart when requested", () => {
    const navigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigate);

    render(
      <OrderSummary
        subTotal={0}
        items={[]}
        count={0}
        shipping={40}
        placeOrderMutation={{ isPending: false } as never}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Return to cart" }));

    expect(navigate).toHaveBeenCalledWith("/cart");
  });
});
