import { vi, afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { CartItemEntity } from "@/features/cart/schema/cart.schema";
import CartItem from "@/pages/HasHeader/cart/_components/CartItem";

const { hookMocks } = vi.hoisted(() => ({
  hookMocks: {
    useCartItem: vi.fn(),
    handleQuantityChange: vi.fn(),
    handleInputFocus: vi.fn(),
    handleInputBlur: vi.fn(),
    deleteItem: vi.fn(),
  },
}));

vi.mock("@/hooks/useCartItem", () => ({
  useCartItem: hookMocks.useCartItem,
}));

const item: CartItemEntity & { isChecked: boolean } = {
  CartItemID: 7,
  Quantity: 3,
  MainImage: "/keyboard.jpg",
  Price: "1000",
  Name: "Test Keyboard",
  Color: "Black",
  Stock: 10,
  VariantID: 42,
  ProductType: "KeyboardKit",
  SubType: "75%",
  isChecked: true,
};

const handleToggleCheck = vi.fn();

describe("CartItem", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    hookMocks.useCartItem.mockReturnValue({
      quantityInput: "3",
      canIncrease: true,
      canDecrease: true,
      isQuantityUpdating: false,
      handleQuantityChange: hookMocks.handleQuantityChange,
      handleInputFocus: hookMocks.handleInputFocus,
      handleInputBlur: hookMocks.handleInputBlur,
      deleteItem: hookMocks.deleteItem,
    });
  });

  it("renders item details, price, and checked state", () => {
    render(<CartItem item={item} handleToggleCheck={handleToggleCheck} />);

    expect(
      screen.getByRole("heading", { name: "Test Keyboard" }),
    ).toBeVisible();
    expect(screen.getByText("KeyboardKit")).toBeVisible();
    expect(screen.getByText("75%")).toBeVisible();
    expect(screen.getByText("Variant: Black")).toBeVisible();
    expect(screen.getByText("1.000 VND EACH")).toBeVisible();
    expect(screen.getByText("3.000 VND")).toBeVisible();
    expect(screen.getByRole("spinbutton")).toHaveValue(3);
    expect(screen.getByRole("checkbox")).toBeChecked();

    fireEvent.click(screen.getByRole("checkbox"));
    expect(handleToggleCheck).toHaveBeenCalledWith(item.CartItemID);
  });

  it("uses hook-provided quantity state and delegates quantity input events", () => {
    hookMocks.useCartItem.mockReturnValue({
      quantityInput: "6",
      canIncrease: false,
      canDecrease: false,
      isQuantityUpdating: true,
      handleQuantityChange: hookMocks.handleQuantityChange,
      handleInputFocus: hookMocks.handleInputFocus,
      handleInputBlur: hookMocks.handleInputBlur,
      deleteItem: hookMocks.deleteItem,
    });

    render(<CartItem item={item} handleToggleCheck={handleToggleCheck} />);

    expect(hookMocks.useCartItem).toHaveBeenCalledWith(item);
    expect(screen.getByRole("spinbutton")).toHaveValue(6);
    expect(
      screen.getByRole("button", { name: "Decrease quantity" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Increase quantity" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "" })).toBeDisabled();

    const input = screen.getByRole("spinbutton");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "8" } });
    fireEvent.blur(input);

    expect(hookMocks.handleInputFocus).toHaveBeenCalledOnce();
    expect(hookMocks.handleQuantityChange).toHaveBeenNthCalledWith(
      1,
      "input",
      "8",
    );
    expect(hookMocks.handleQuantityChange).toHaveBeenCalledWith("input", "8");
    expect(hookMocks.handleInputBlur).toHaveBeenCalledOnce();
  });

  it("delegates plus, minus, and delete actions to the hook", () => {
    render(<CartItem item={item} handleToggleCheck={handleToggleCheck} />);

    fireEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    fireEvent.click(screen.getByRole("button", { name: "" }));

    expect(hookMocks.handleQuantityChange).toHaveBeenNthCalledWith(
      1,
      "decrease",
    );
    expect(hookMocks.handleQuantityChange).toHaveBeenNthCalledWith(
      2,
      "increase",
    );
    expect(hookMocks.deleteItem).toHaveBeenCalledOnce();
  });

  it("shows the out-of-stock state", () => {
    render(
      <CartItem
        item={{ ...item, Stock: 0 }}
        handleToggleCheck={handleToggleCheck}
      />,
    );

    expect(screen.getByText("Out of Stock")).toBeVisible();
  });
});
