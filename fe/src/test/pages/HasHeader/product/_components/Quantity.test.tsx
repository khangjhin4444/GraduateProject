import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import Quantity from "@/pages/HasHeader/product/_components/Quantity";

function QuantityHarness({
  stock,
  initialQuantity = 1,
}: {
  stock: number;
  initialQuantity?: number;
}) {
  const [quantity, setQuantity] = useState(initialQuantity);
  return (
    <Quantity
      quantity={quantity}
      currentStock={stock}
      setQuantity={setQuantity}
    />
  );
}

describe("Quantity", () => {
  afterEach(() => cleanup());

  it("increments and decrements without going below one", () => {
    render(<QuantityHarness stock={3} />);
    const input = screen.getByRole("spinbutton");
    const buttons = screen.getAllByRole("button");

    fireEvent.click(buttons[0]);
    expect(input).toHaveValue(1);
    fireEvent.click(buttons[1]);
    expect(input).toHaveValue(2);
    fireEvent.click(buttons[1]);
    fireEvent.click(buttons[1]);
    expect(input).toHaveValue(3);
    fireEvent.click(buttons[1]);
    expect(input).toHaveValue(3);
    fireEvent.click(buttons[0]);
    expect(input).toHaveValue(2);
  });

  it("caps typed quantities at stock and restores a minimum of one on blur", () => {
    render(<QuantityHarness stock={4} />);
    const input = screen.getByRole("spinbutton");

    fireEvent.change(input, { target: { value: "9" } });
    expect(input).toHaveValue(4);
    fireEvent.change(input, { target: { value: "" } });
    expect(input).toHaveValue(0);
    fireEvent.blur(input);
    expect(input).toHaveValue(1);
  });

  it("accepts a valid quantity within stock and leaves valid quantities unchanged on blur", () => {
    render(<QuantityHarness stock={4} />);
    const input = screen.getByRole("spinbutton");

    fireEvent.change(input, { target: { value: "2" } });
    expect(input).toHaveValue(2);
    fireEvent.blur(input);
    expect(input).toHaveValue(2);
  });
});
