import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCancelOrder } from "@/hooks/useCancelOrder";
import OrderInformation from "@/pages/HasHeader/order/_component/OrderInformation";

vi.mock("@/hooks/useCancelOrder", () => ({
  useCancelOrder: vi.fn(),
}));

const order = {
  OrderID: 8,
  UserID: 2,
  Date: "2026-10-09T12:00:00.000Z",
  Shipping: "Fast",
  Status: "Pending",
  Payment: "COD",
  ReceiverName: "Keyboard User",
  Phone: "1234567890",
  Address: "Keyboard Street",
  Total: "1200",
  Request: null,
  items: [],
};

describe("OrderInformation", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders recipient and delivery/payment details and cancels pending orders", () => {
    const handleCancelOrder = vi.fn();
    vi.mocked(useCancelOrder).mockReturnValue({
      handleCancelOrder,
    } as never);

    render(<OrderInformation order={order} />);

    expect(screen.getByText("Keyboard User")).toBeInTheDocument();
    expect(screen.getByText("1234567890")).toBeInTheDocument();
    expect(screen.getByText("Keyboard Street")).toBeInTheDocument();
    expect(screen.getByText("Note: None")).toBeInTheDocument();
    expect(screen.getByText("Express Delivery")).toBeInTheDocument();
    expect(screen.getByText("Cash on delivery")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel Order" }));
    expect(handleCancelOrder).toHaveBeenCalledWith(8);
  });

  it("does not show cancel action for a non-pending order", () => {
    vi.mocked(useCancelOrder).mockReturnValue({
      handleCancelOrder: vi.fn(),
    } as never);

    render(
      <OrderInformation
        order={{
          ...order,
          Status: "Delivered",
          Shipping: "Normal",
          Payment: "Banking",
        }}
      />,
    );

    expect(screen.queryByRole("button", { name: "Cancel Order" })).toBeNull();
    expect(screen.getByText("Standard Delivery")).toBeInTheDocument();
    expect(screen.getByText("Bank Transfer")).toBeInTheDocument();
  });
});
