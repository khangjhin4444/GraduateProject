import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useOrders from "@/hooks/useOrders";
import { useCancelOrder } from "@/hooks/useCancelOrder";
import OrderList from "@/pages/HasHeader/order/_component/OrderList";

vi.mock("@/hooks/useOrders", () => ({ default: vi.fn() }));
vi.mock("@/hooks/useCancelOrder", () => ({ useCancelOrder: vi.fn() }));
vi.mock("@/shared/components/OrderListSkeleton", () => ({
  default: () => <div data-testid="orders-skeleton" />,
}));

const orders = [
  {
    OrderID: 10,
    UserID: 1,
    Date: "2026-10-09T12:00:00.000Z",
    Shipping: "Fast",
    Status: "Pending",
    Payment: "COD",
    ReceiverName: "First Customer",
    Phone: "1111111111",
    Address: "First Street",
    Total: "100000",
    Request: null,
    items: [
      {
        OrderItemID: 101,
        Name: "First Keyboard",
        Color: "Black",
        MainImage: "/first-keyboard.jpg",
        Quantity: 1,
        Price: "100000",
        ProductType: "KeyboardKit",
        SubType: "75%",
      },
    ],
  },
  {
    OrderID: 11,
    UserID: 2,
    Date: "2026-10-09T13:00:00.000Z",
    Shipping: "Standard",
    Status: "Pending",
    Payment: "Banking",
    ReceiverName: "Second Customer",
    Phone: "2222222222",
    Address: "Second Street",
    Total: "200000",
    Request: "Call on arrival",
    items: [
      {
        OrderItemID: 111,
        Name: "Second Keyboard",
        Color: "White",
        MainImage: "/second-keyboard.jpg",
        Quantity: 1,
        Price: "200000",
        ProductType: "KeyboardKit",
        SubType: "TKL",
      },
    ],
  },
];

describe("OrderList", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders full order cards and their item and recipient details", () => {
    vi.mocked(useCancelOrder).mockReturnValue({
      handleCancelOrder: vi.fn(),
    } as never);
    vi.mocked(useOrders).mockReturnValue({
      data: { pages: [{ data: orders }] },
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      isLoading: false,
      isFetchingNextPage: false,
    } as never);

    render(<OrderList status="Pending" />);

    expect(useOrders).toHaveBeenCalledWith("Pending");
    expect(screen.getByText("First Keyboard")).toBeInTheDocument();
    expect(screen.getByText("Second Keyboard")).toBeInTheDocument();
    expect(screen.getByText("First Customer")).toBeInTheDocument();
    expect(screen.getByText("Second Customer")).toBeInTheDocument();
  });

  it("renders orders for the requested status", () => {
    vi.mocked(useCancelOrder).mockReturnValue({
      handleCancelOrder: vi.fn(),
    } as never);
    vi.mocked(useOrders).mockReturnValue({
      data: { pages: [{ data: orders }] },
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      isLoading: false,
      isFetchingNextPage: false,
    } as never);

    render(<OrderList status="Pending" />);

    expect(useOrders).toHaveBeenCalledWith("Pending");
    expect(screen.getByText("#JK10")).toBeInTheDocument();
    expect(screen.getByText("#JK11")).toBeInTheDocument();
  });

  it("loads the next page and disables the button while loading", () => {
    const fetchNextPage = vi.fn();
    vi.mocked(useOrders).mockReturnValue({
      data: { pages: [{ data: [] }] },
      hasNextPage: true,
      fetchNextPage,
      isLoading: false,
      isFetchingNextPage: false,
    } as never);

    const view = render(<OrderList status="Delivered" />);
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(fetchNextPage).toHaveBeenCalledOnce();

    vi.mocked(useOrders).mockReturnValue({
      data: { pages: [{ data: [] }] },
      hasNextPage: true,
      fetchNextPage,
      isLoading: false,
      isFetchingNextPage: true,
    } as never);
    view.rerender(<OrderList status="Delivered" />);

    expect(screen.getByRole("button", { name: "Loading..." })).toBeDisabled();
  });

  it("shows a status-specific empty state", () => {
    vi.mocked(useOrders).mockReturnValue({
      data: { pages: [{ data: [] }] },
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      isLoading: false,
      isFetchingNextPage: false,
    } as never);

    render(<OrderList status="Canceled" />);

    expect(
      screen.getByRole("heading", { name: "No order found in Canceled state" }),
    ).toBeInTheDocument();
  });
  it("show loading state", () => {
    vi.mocked(useOrders).mockReturnValue({
      data: { pages: [{ data: [] }] },
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      isLoading: true,
      isFetchingNextPage: false,
    } as never);
    render(<OrderList status="Canceled" />);
    expect(screen.getByTestId("orders-skeleton")).toBeInTheDocument();
  });
});
