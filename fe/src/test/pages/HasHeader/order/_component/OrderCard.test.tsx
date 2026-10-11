import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderEntity } from "@/features/order/schema/order.schema";
import { useCancelOrder } from "@/hooks/useCancelOrder";
import OrderCard from "@/pages/HasHeader/order/_component/OrderCard";

vi.mock("@/hooks/useCancelOrder", () => ({
  useCancelOrder: vi.fn(),
}));

const order: OrderEntity = {
  OrderID: 42,
  UserID: 3,
  Date: "2026-10-09T12:34:00.000Z",
  Shipping: "Fast",
  Status: "Pending",
  Payment: "COD",
  ReceiverName: "Keyboard User",
  Phone: "1234567890",
  Address: "Keyboard Street",
  Total: "175000",
  Request: null,
  items: [
    {
      OrderItemID: 1,
      Name: "Mechanical Keyboard",
      Color: "Black",
      MainImage: "/keyboard.jpg",
      Quantity: 1,
      Price: "150000",
      ProductType: "KeyboardKit",
      SubType: "75%",
    },
  ],
};

describe("OrderCard", () => {
  beforeEach(() => {
    vi.mocked(useCancelOrder).mockReturnValue({
      handleCancelOrder: vi.fn(),
    } as never);
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders order status, date, item details, and recipient information", () => {
    const { container } = render(<OrderCard order={order} />);

    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/keyboard.jpg",
    );
    expect(
      screen.getByRole("heading", { name: "Mechanical Keyboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("19:34 09/10/2026, 1 item")).toBeInTheDocument();
    expect(screen.getByText("Variant: Black")).toBeInTheDocument();
    expect(screen.getByText("150.000 VND x 1")).toBeInTheDocument();
    expect(screen.getByText("Keyboard User")).toBeInTheDocument();
    expect(screen.getByText("175.000 VND")).toBeInTheDocument();
  });

  it("renders multiple items and the delivered status", () => {
    const secondItem = {
      ...order.items[0],
      OrderItemID: 2,
      Name: "PBT Keycaps",
      Color: "White",
      MainImage: "/keycaps.jpg",
      Quantity: 2,
      Price: "25000",
    };

    const { container } = render(
      <OrderCard
        order={{
          ...order,
          Status: "Delivered",
          items: [...order.items, secondItem],
        }}
      />,
    );

    expect(screen.getByText("Delivered")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Mechanical Keyboard" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "PBT Keycaps" }),
    ).toBeInTheDocument();
    const images = container.querySelectorAll("img");
    expect(images[0]).toHaveAttribute("src", "/keyboard.jpg");
    expect(images[1]).toHaveAttribute("src", "/keycaps.jpg");
  });

  it("renders an empty order with canceled status", () => {
    const { container } = render(
      <OrderCard order={{ ...order, Status: "Canceled", items: [] }} />,
    );

    expect(screen.getByText("Canceled")).toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });
});
