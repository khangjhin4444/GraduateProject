import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Page from "@/pages/HasHeader/order";

vi.mock("@/pages/HasHeader/order/_component/OrderList", () => ({
  default: ({ status }: { status: string }) => (
    <div data-testid="order-list" data-status={status}>
      {status} orders
    </div>
  ),
}));

describe("Order page", () => {
  afterEach(() => cleanup());

  it("shows the order summary and pending orders by default", () => {
    render(<Page />);

    expect(screen.getByRole("heading", { name: "My Orders" })).toBeInTheDocument();
    expect(
      screen.getByText("Here is a summary of your current and past orders."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("order-list")).toHaveAttribute(
      "data-status",
      "Pending",
    );
  });

  it.each([
    ["Confirmed", "Confirmed"],
    ["Delivered", "Delivered"],
    ["Canceled", "Canceled"],
  ])("shows %s orders when the matching tab is selected", (tab, status) => {
    render(<Page />);
    fireEvent.click(screen.getByRole("tab", { name: tab }));

    expect(screen.getByTestId("order-list")).toHaveAttribute(
      "data-status",
      status,
    );
  });
});
