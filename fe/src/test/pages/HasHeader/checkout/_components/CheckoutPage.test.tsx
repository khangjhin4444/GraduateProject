import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePlaceOrder } from "@/hooks/usePlaceOrder";
import { usePrepareOrder } from "@/hooks/usePrepareOrder";
import CheckoutPage from "@/pages/HasHeader/checkout/_components/CheckoutPage";

vi.mock("@/hooks/usePrepareOrder", () => ({ usePrepareOrder: vi.fn() }));
vi.mock("@/hooks/usePlaceOrder", () => ({ usePlaceOrder: vi.fn() }));
vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useNavigate: vi.fn() };
});
vi.mock("@/pages/HasHeader/checkout/_components/CheckoutSkeleton", () => ({
  default: () => <div data-testid="checkout-skeleton">Loading checkout</div>,
}));
vi.mock("@/pages/HasHeader/checkout/_components/OrderForm", () => ({
  default: ({
    items,
    isBuyNow,
  }: {
    items: { VariantID: number }[];
    isBuyNow: boolean;
  }) => (
    <div data-testid="order-form">
      {JSON.stringify({ itemIds: items.map((item) => item.VariantID), isBuyNow })}
    </div>
  ),
}));
vi.mock("@/pages/HasHeader/checkout/_components/OrderSummary", () => ({
  default: ({
    count,
    subTotal,
    shipping,
  }: {
    count: number;
    subTotal: number;
    shipping: number;
  }) => (
    <div data-testid="order-summary">
      {JSON.stringify({ count, subTotal, shipping })}
    </div>
  ),
}));

const preparedItems = [
  {
    VariantID: 42,
    Name: "Keyboard",
    ProductType: "KeyboardKit",
    SubType: "75%",
    Color: "Black",
    MainImage: "/keyboard.jpg",
    Price: "100000",
    Quantity: 2,
  },
];

function renderPage(queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})) {
  const view = render(
    <QueryClientProvider client={queryClient}>
      <CheckoutPage checkoutItems={[{ id: 42, qty: 2 }]} isBuyNow={false} />
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

describe("CheckoutPage", () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(vi.fn());
    vi.mocked(usePlaceOrder).mockReturnValue({
      placeOrderMutation: { isPending: false },
    } as never);
    vi.mocked(usePrepareOrder).mockReturnValue({
      data: {
        warnings: 0,
        subTotal: 200000,
        items: preparedItems,
      },
      isPending: false,
      isError: false,
      error: null,
    } as never);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows a loading skeleton while preparing order data", () => {
    vi.mocked(usePrepareOrder).mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      error: null,
    } as never);

    renderPage();

    expect(screen.getByTestId("checkout-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("order-form")).not.toBeInTheDocument();
  });

  it("shows the error state when order preparation fails", () => {
    vi.mocked(usePrepareOrder).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("Could not prepare order"),
    } as never);

    renderPage();

    expect(screen.getByText(/Something went wrong:/)).toHaveTextContent(
      "Could not prepare order",
    );
  });

  it("returns the user to cart when no selected items remain available", () => {
    const navigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigate);
    vi.mocked(usePrepareOrder).mockReturnValue({
      data: { warnings: 0, subTotal: 0, items: [] },
      isPending: false,
      isError: false,
      error: null,
    } as never);

    renderPage();

    expect(
      screen.getByText(/None of the selected items are currently available/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Return to cart" }));
    expect(navigate).toHaveBeenCalledWith("/cart");
  });

  it("renders the form and totals from prepared data", () => {
    renderPage();
    expect(screen.getByTestId("order-form")).toHaveTextContent(
      JSON.stringify({ itemIds: [42], isBuyNow: false }),
    );
    expect(screen.getByTestId("order-summary")).toHaveTextContent(
      JSON.stringify({ count: 2, subTotal: 200000, shipping: 40 }),
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("invalidates the cart when prepared items have stock warnings", () => {
    vi.mocked(usePrepareOrder).mockReturnValue({
      data: { warnings: 1, subTotal: 100000, items: [preparedItems[0]] },
      isPending: false,
      isError: false,
      error: null,
    } as never);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    renderPage(queryClient);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["cart"] });
  });
});
