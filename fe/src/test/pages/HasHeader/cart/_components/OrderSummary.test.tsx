import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";
import OrderSummary from "@/pages/HasHeader/cart/_components/OrderSummary";

vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useNavigate: vi.fn() };
});
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

describe("Cart OrderSummary", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("requires a checked item before proceeding to checkout", () => {
    const navigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigate);
    render(
      <OrderSummary
        selectedItems={[
          {
            CartItemID: 1,
            Quantity: 1,
            MainImage: "/keyboard.jpg",
            Price: "100",
            Name: "Keyboard",
            Color: "Black",
            Stock: 5,
            VariantID: 42,
            ProductType: "KeyboardKit",
            SubType: "75%",
            isChecked: false,
          },
        ]}
        cartQuantity={1}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Proceed to Checkout" }),
    );

    expect(toast.error).toHaveBeenCalledWith(
      "Please select at least 1 item to checkout!",
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it("passes selected variant IDs and quantities to checkout", () => {
    const navigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigate);
    const items = [
      {
        CartItemID: 1,
        Quantity: 2,
        MainImage: "/keyboard.jpg",
        Price: "100",
        Name: "Keyboard",
        Color: "Black",
        Stock: 5,
        VariantID: 42,
        ProductType: "KeyboardKit",
        SubType: "75%",
        isChecked: true,
      },
      {
        CartItemID: 2,
        Quantity: 1,
        MainImage: "/keycap.jpg",
        Price: "50",
        Name: "Keycap",
        Color: "White",
        Stock: 5,
        VariantID: 43,
        ProductType: "Keycap",
        SubType: "SA",
        isChecked: false,
      },
    ];
    render(<OrderSummary selectedItems={items} cartQuantity={3} />);

    expect(screen.getByText("Subtotal (2 items)")).toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Proceed to Checkout" }).at(-1)!,
    );

    expect(navigate).toHaveBeenCalledWith("/checkout", {
      state: { checkoutItems: [{ id: 42, qty: 2 }] },
    });
  });
  it("calculates subtotal correctly for checked items only", () => {
    const items = [
      {
        CartItemID: 1,
        Quantity: 2,
        MainImage: "/keyboard.jpg",
        Price: "100000",
        Name: "Keyboard",
        Color: "Black",
        Stock: 5,
        VariantID: 42,
        ProductType: "KeyboardKit",
        SubType: "75%",
        isChecked: true,
      },
      {
        CartItemID: 2,
        Quantity: 1,
        MainImage: "/keycap.jpg",
        Price: "50000",
        Name: "Keycap",
        Color: "White",
        Stock: 5,
        VariantID: 43,
        ProductType: "Keycap",
        SubType: "SA",
        isChecked: false,
      },
    ];
    render(<OrderSummary selectedItems={items} cartQuantity={3} />);
    expect(screen.getByTestId("subtotal")).toHaveTextContent("200.000 VND");
  });
  it("navigates user to keyboard collection when click continue shopping", () => {
    const navigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigate);
    const items = [
      {
        CartItemID: 1,
        Quantity: 2,
        MainImage: "/keyboard.jpg",
        Price: "100000",
        Name: "Keyboard",
        Color: "Black",
        Stock: 5,
        VariantID: 42,
        ProductType: "KeyboardKit",
        SubType: "75%",
        isChecked: true,
      },
      {
        CartItemID: 2,
        Quantity: 1,
        MainImage: "/keycap.jpg",
        Price: "50000",
        Name: "Keycap",
        Color: "White",
        Stock: 5,
        VariantID: 43,
        ProductType: "Keycap",
        SubType: "SA",
        isChecked: false,
      },
    ];
    render(<OrderSummary selectedItems={items} cartQuantity={3} />);
    fireEvent.click(screen.getByRole("button", { name: "Continue Shopping" }));
    expect(navigate).toHaveBeenCalledWith("/collection/keyboardkit");
  });
});
