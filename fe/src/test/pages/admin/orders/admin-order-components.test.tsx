import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderEntity } from "@/features/order/schema/order.schema";
import useAdminOrders from "@/hooks/useOrderAdmin";
import { useAdminOrderAction } from "@/hooks/useAdminOrderAction";
import AdminOrderCard from "@/pages/admin/orders/_component/OrderCard";
import AdminOrderInformation from "@/pages/admin/orders/_component/OrderInformation";
import AdminOrderList from "@/pages/admin/orders/_component/OrderList";

vi.mock("@/hooks/useOrderAdmin", () => ({ default: vi.fn() }));
vi.mock("@/hooks/useAdminOrderAction", () => ({
  useAdminOrderAction: vi.fn(),
}));
vi.mock("@/shared/components/OrderListSkeleton", () => ({
  default: () => <div data-testid="admin-orders-skeleton">Loading orders</div>,
}));

const order: OrderEntity = {
  OrderID: 72,
  UserID: 5,
  Date: "2026-10-11T12:00:00.000Z",
  Shipping: "Fast",
  Status: "Pending",
  Payment: "COD",
  ReceiverName: "Admin Test Customer",
  Phone: "0123456789",
  Address: "Test Address",
  Total: "250000",
  Request: "Leave at reception",
  items: [
    {
      OrderItemID: 1,
      Name: "Admin Test Keyboard",
      Color: "Blue",
      MainImage: "/admin-keyboard.jpg",
      Quantity: 1,
      Price: "250000",
      ProductType: "KeyboardKit",
      SubType: "75%",
    },
  ],
};

const cancel = vi.fn();
const proceed = vi.fn();
const deliver = vi.fn();

function actionState(overrides: Record<string, boolean> = {}) {
  return {
    handleCancelOrder: cancel,
    handleProceedOrder: proceed,
    handleDeliverOrder: deliver,
    isCancelPending: false,
    isDeliverPending: false,
    isProceedPending: false,
    ...overrides,
  };
}

describe("AdminOrderInformation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAdminOrderAction).mockReturnValue(actionState() as never);
  });

  afterEach(() => cleanup());

  it("shows recipient, note, delivery/payment details and pending actions", async () => {
    const user = userEvent.setup();
    render(<AdminOrderInformation order={order} />);

    expect(screen.getByText("RECIPIENT")).toBeInTheDocument();
    expect(screen.getByText("Admin Test Customer")).toBeInTheDocument();
    expect(screen.getByText("0123456789")).toBeInTheDocument();
    expect(screen.getByText("Test Address")).toBeInTheDocument();
    expect(screen.getByText("Note: Leave at reception")).toBeInTheDocument();
    expect(screen.getByText("Express Delivery")).toBeInTheDocument();
    expect(screen.getByText("Cash on delivery")).toBeInTheDocument();
    expect(screen.getByText("250.000 VND")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm Order" }));
    await user.click(screen.getByRole("button", { name: "Cancel Order" }));

    expect(proceed).toHaveBeenCalledWith(order.OrderID);
    expect(cancel).toHaveBeenCalledWith(order.OrderID);
  });

  it("shows pending labels and disables actions while a mutation is pending", () => {
    vi.mocked(useAdminOrderAction).mockReturnValue(
      actionState({
        isProceedPending: true,
        isCancelPending: true,
      }) as never,
    );

    render(<AdminOrderInformation order={order} />);

    expect(
      screen.getByRole("button", { name: "Confirming Order..." }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Canceling Order..." }),
    ).toBeDisabled();
  });

  it("allows confirming orders to be delivered and handles pending action states", async () => {
    const user = userEvent.setup();
    vi.mocked(useAdminOrderAction).mockReturnValue(
      actionState({ isDeliverPending: true }) as never,
    );

    render(<AdminOrderInformation order={{ ...order, Status: "Confirmed" }} />);

    const deliverButton = screen.getByRole("button", {
      name: "Setting to Delivered...",
    });
    expect(deliverButton).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel Order" })).toBeDisabled();

    vi.mocked(useAdminOrderAction).mockReturnValue(actionState() as never);
    cleanup();
    render(<AdminOrderInformation order={{ ...order, Status: "Confirmed" }} />);
    await user.click(screen.getByRole("button", { name: "Set to Delivered" }));
    await user.click(screen.getByRole("button", { name: "Cancel Order" }));
    expect(deliver).toHaveBeenCalledWith(order.OrderID);
    expect(cancel).toHaveBeenCalledWith(order.OrderID);
  });

  it("hides order actions for delivered orders", () => {
    render(
      <AdminOrderInformation
        order={{
          ...order,
          Status: "Delivered",
          Shipping: "Normal",
          Payment: "Banking",
          Request: null,
        }}
      />,
    );

    expect(screen.getByText("Note: None")).toBeInTheDocument();
    expect(screen.getByText("Standard Delivery")).toBeInTheDocument();
    expect(screen.getByText("Bank Transfer")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("AdminOrderCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAdminOrderAction).mockReturnValue(actionState() as never);
  });

  afterEach(() => cleanup());

  it.each(["Pending", "Confirmed", "Delivered", "Canceled"])(
    "renders the order and status icon for %s",
    (status) => {
      render(<AdminOrderCard order={{ ...order, Status: status }} />);

      expect(screen.getByText("#JK72")).toBeInTheDocument();
      expect(screen.getByText(status)).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Admin Test Keyboard" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Admin Test Customer")).toBeInTheDocument();
    },
  );

  it("uses the plural item label for orders containing multiple items", () => {
    render(
      <AdminOrderCard
        order={{
          ...order,
          items: [
            ...order.items,
            { ...order.items[0], OrderItemID: 2, Name: "Second Keyboard" },
          ],
        }}
      />,
    );

    expect(screen.getByText(/2 items/)).toBeInTheDocument();
  });
});

describe("AdminOrderList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAdminOrderAction).mockReturnValue(actionState() as never);
  });

  afterEach(() => cleanup());

  it("shows loading skeleton while orders are loading", () => {
    vi.mocked(useAdminOrders).mockReturnValue({
      data: undefined,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      isLoading: true,
      isFetchingNextPage: false,
    } as never);

    render(<AdminOrderList status="Pending" />);

    expect(screen.getByTestId("admin-orders-skeleton")).toBeInTheDocument();
  });

  it("renders real order cards for returned orders", () => {
    vi.mocked(useAdminOrders).mockReturnValue({
      data: { pages: [{ data: [order] }] },
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      isLoading: false,
      isFetchingNextPage: false,
    } as never);

    render(<AdminOrderList status="Pending" />);

    expect(screen.getByText("#JK72")).toBeInTheDocument();
    expect(screen.getByText("Admin Test Keyboard")).toBeInTheDocument();
    expect(screen.getByText("Admin Test Customer")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    const fetchNextPage = vi.fn().mockResolvedValue({ isError: false });
    vi.mocked(useAdminOrders).mockReturnValue({
      data: { pages: [{ data: [] }] },
      hasNextPage: false,
      fetchNextPage,
      isLoading: false,
      isFetchingNextPage: false,
    } as never);

    render(<AdminOrderList status="Canceled" />);

    expect(
      screen.getByRole("heading", {
        name: "No order found in Canceled state",
      }),
    ).toBeInTheDocument();
  });
  it("show more orders when click loadmore and loading state when fetching next page", async () => {
    const user = userEvent.setup();
    const fetchNextPage = vi.fn().mockResolvedValue({ isError: false });
    vi.mocked(useAdminOrders).mockReturnValue({
      data: { pages: [{ data: [] }] },
      hasNextPage: true,
      fetchNextPage,
      isLoading: false,
      isFetchingNextPage: false,
    } as never);

    const { rerender } = render(<AdminOrderList status="Canceled" />);

    await user.click(screen.getByRole("button", { name: "Load more" }));
    expect(fetchNextPage).toHaveBeenCalledOnce();

    vi.mocked(useAdminOrders).mockReturnValue({
      data: { pages: [{ data: [] }] },
      hasNextPage: true,
      fetchNextPage,
      isLoading: false,
      isFetchingNextPage: true,
    } as never);
    rerender(<AdminOrderList status="Canceled" />);

    expect(screen.getByRole("button", { name: "Loading..." })).toBeDisabled();
  });
});
