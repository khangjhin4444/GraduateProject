import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OrderUsecase } from "@/features/order/usecase/order.usecase";
import CheckoutPage from "@/pages/HasHeader/checkout/_components/CheckoutPage";
import { setInfo } from "@/state/profile/profileSlice";
import { store } from "@/state/store";

vi.mock("@/features/order/usecase/order.usecase", () => ({
  OrderUsecase: {
    prepareOrder: vi.fn(),
    placeOrder: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    loading: vi.fn(() => "toast-id"),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const checkoutItems = [{ id: 42, qty: 2 }];
const preparedOrder = {
  success: true,
  message: "Prepared",
  warnings: 0,
  totalQuantity: 2,
  subTotal: 200000,
  items: [
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
  ],
};

describe("Checkout integration", () => {
  beforeEach(() => {
    store.dispatch(
      setInfo({
        id: 7,
        fullName: "Keyboard Buyer",
        phoneNumber: "0123456789",
        address: "123 Keyboard Street",
        role: "user",
      }),
    );
    vi.mocked(OrderUsecase.prepareOrder).mockResolvedValue(preparedOrder);
    vi.mocked(OrderUsecase.placeOrder).mockResolvedValue({
      success: true,
      message: "Order placed",
      orderId: 501,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("submits the form, updates delivery total, places order, and navigates to orders", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={["/checkout"]}>
            <Routes>
              <Route
                path="/checkout"
                element={
                  <CheckoutPage checkoutItems={checkoutItems} isBuyNow={false} />
                }
              />
              <Route
                path="/order"
                element={<h1>Order history</h1>}
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>,
    );

    expect(await screen.findByText("Keyboard")).toBeInTheDocument();
    expect(screen.getByText("240.000 VND")).toBeInTheDocument();
    expect(OrderUsecase.prepareOrder).toHaveBeenCalledWith(checkoutItems);

    await user.click(screen.getByRole("radio", { name: /Express Delivery/ }));
    expect(screen.getByText("280.000 VND")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /Banking transfer/ }));
    expect(screen.getByText("240.000 VND")).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Order Note (Optional)"),
      "Call on arrival",
    );
    await user.click(screen.getByRole("button", { name: "Place Order" }));

    await waitFor(() =>
      expect(OrderUsecase.placeOrder).toHaveBeenCalledWith({
        name: "Keyboard Buyer",
        phone: "0123456789",
        address: "123 Keyboard Street",
        request: "Call on arrival",
        shipping: "Fast",
        payment: "Banking",
        save: true,
        variantIds: [42],
      }),
    );
    expect(await screen.findByRole("heading", { name: "Order history" })).toBeInTheDocument();
  });
});
