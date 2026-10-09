import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCartItem } from "@/hooks/useCartItem";
import CartItem from "@/pages/HasHeader/cart/_components/CartItem";

vi.mock("@/hooks/useCartItem", () => ({ useCartItem: vi.fn() }));

describe("CartItem", () => {
  afterEach(() => cleanup());

  it("displays item details and forwards quantity, delete, and selection actions", () => {
    const handleQuantityChange = vi.fn();
    const handleInputFocus = vi.fn();
    const handleInputBlur = vi.fn();
    const deleteItem = vi.fn();
    const handleToggleCheck = vi.fn();
    vi.mocked(useCartItem).mockReturnValue({
      quantityInput: "2",
      canIncrease: true,
      canDecrease: true,
      isQuantityUpdating: false,
      handleQuantityChange,
      handleInputFocus,
      handleInputBlur,
      deleteItem,
    } as never);
    const item = {
      CartItemID: 9,
      Quantity: 2,
      MainImage: "/keyboard.jpg",
      Price: "1000",
      Name: "Test Keyboard",
      Color: "Black",
      Stock: 5,
      VariantID: 30,
      ProductType: "KeyboardKit",
      SubType: "75%",
      isChecked: true,
    };

    render(<CartItem item={item} handleToggleCheck={handleToggleCheck} />);

    expect(
      screen.getByRole("heading", { name: "Test Keyboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Variant: Black")).toBeInTheDocument();
    const quantity = screen.getByRole("spinbutton");
    fireEvent.focus(quantity);
    fireEvent.change(quantity, { target: { value: "3" } });
    fireEvent.blur(quantity);
    expect(handleInputFocus).toHaveBeenCalledOnce();
    expect(handleQuantityChange).toHaveBeenCalledWith("input", "3");
    expect(handleInputBlur).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(handleQuantityChange).toHaveBeenCalledWith("increase");
    fireEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(handleQuantityChange).toHaveBeenCalledWith("decrease");
    fireEvent.click(screen.getByRole("button", { name: "" }));
    expect(deleteItem).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("checkbox"));
    expect(handleToggleCheck).toHaveBeenCalledWith(9);
  });

  it("marks an out-of-stock item and disables quantity changes", () => {
    vi.mocked(useCartItem).mockReturnValue({
      quantityInput: "1",
      canIncrease: false,
      canDecrease: false,
      isQuantityUpdating: true,
      handleQuantityChange: vi.fn(),
      handleInputFocus: vi.fn(),
      handleInputBlur: vi.fn(),
      deleteItem: vi.fn(),
    } as never);
    const item = {
      CartItemID: 10,
      Quantity: 1,
      MainImage: "/keyboard.jpg",
      Price: "1000",
      Name: "Unavailable Keyboard",
      Color: "Black",
      Stock: 0,
      VariantID: 31,
      ProductType: "KeyboardKit",
      SubType: "75%",
      isChecked: false,
    };

    render(<CartItem item={item} handleToggleCheck={vi.fn()} />);

    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Increase quantity" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "" })).toBeDisabled();
  });
});
