import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CartItemEntity, GetCartResponseEntity } from "@/features/cart/schema/cart.schema";
import { useCart } from "@/hooks/useCart";
import { useCartItem } from "@/hooks/useCartItem";
import CartItemList from "@/pages/HasHeader/cart/_components/CartItemList";

vi.mock("@/hooks/useCart", () => ({ useCart: vi.fn() }));
vi.mock("@/hooks/useCartItem", () => ({ useCartItem: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const firstItem: CartItemEntity = {
  CartItemID: 1,
  Quantity: 2,
  MainImage: "/keyboard.jpg",
  Price: "1000",
  Name: "Test Keyboard",
  Color: "Black",
  Stock: 5,
  VariantID: 42,
  ProductType: "KeyboardKit",
  SubType: "75%",
};

const secondItem: CartItemEntity = {
  CartItemID: 2,
  Quantity: 1,
  MainImage: "/keycap.jpg",
  Price: "500",
  Name: "Test Keycap",
  Color: "White",
  Stock: 4,
  VariantID: 43,
  ProductType: "Keycap",
  SubType: "SA",
};

function makeCart(items: CartItemEntity[]): GetCartResponseEntity {
  return {
    success: true,
    message: "Cart loaded",
    warnings: 0,
    cartQuantity: items.reduce((quantity, item) => quantity + item.Quantity, 0),
    items,
  };
}

function CheckoutState() {
  const location = useLocation();
  return (
    <output data-testid="checkout-state">
      {JSON.stringify(location.state)}
    </output>
  );
}

function renderCart() {
  return render(
    <MemoryRouter initialEntries={["/cart"]}>
      <Routes>
        <Route path="/cart" element={<CartItemList />} />
        <Route path="/checkout" element={<CheckoutState />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CartItemList", () => {
  beforeEach(() => {
    vi.mocked(useCartItem).mockImplementation((item) => ({
      quantityInput: String(item.Quantity),
      canIncrease: item.Quantity < item.Stock,
      canDecrease: item.Quantity > 1,
      isQuantityUpdating: false,
      handleQuantityChange: vi.fn(),
      handleInputFocus: vi.fn(),
      handleInputBlur: vi.fn(),
      deleteItem: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("integrates cart selection with the order summary and checkout navigation", () => {
    vi.mocked(useCart).mockReturnValue({
      data: makeCart([firstItem, secondItem]),
    } as never);

    renderCart();

    expect(screen.getByText("Test Keyboard")).toBeInTheDocument();
    expect(screen.getByText("Test Keycap")).toBeInTheDocument();
    expect(screen.getByText("Subtotal (3 items)")).toBeInTheDocument();
    expect(screen.getByTestId("subtotal")).toHaveTextContent("2.500 VND");

    fireEvent.click(screen.getAllByRole("checkbox")[1]);

    expect(screen.getByText("Subtotal (2 items)")).toBeInTheDocument();
    expect(screen.getByTestId("subtotal")).toHaveTextContent("2.000 VND");

    fireEvent.click(
      screen.getByRole("button", { name: "Proceed to Checkout" }),
    );

    expect(screen.getByTestId("checkout-state")).toHaveTextContent(
      JSON.stringify({ checkoutItems: [{ id: 42, qty: 2 }] }),
    );
  });

  it("shows the empty-cart message and browse link", () => {
    vi.mocked(useCart).mockReturnValue({
      data: makeCart([]),
    } as never);

    renderCart();

    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Browse products" }),
    ).toHaveAttribute("href", "/collection/keyboardkit");
  });
});
