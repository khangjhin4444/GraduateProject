import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderProdudctEntity } from "@/features/order/schema/order.schema";
import type { PlaceOrderProps } from "@/features/order/service/order.service";
import OrderForm from "@/pages/HasHeader/checkout/_components/OrderForm";
import { deleteInfo, setInfo } from "@/state/profile/profileSlice";
import { store } from "@/state/store";

const items: OrderProdudctEntity[] = [
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
  {
    VariantID: 43,
    Name: "Keycap",
    ProductType: "Keycap",
    SubType: "SA",
    Color: "White",
    MainImage: "/keycap.jpg",
    Price: "50000",
    Quantity: 1,
  },
];

function renderForm({
  mutateAsync = vi.fn().mockResolvedValue(undefined),
  setShipping = vi.fn(),
  isBuyNow = false,
}: {
  mutateAsync?: (payload: PlaceOrderProps) => Promise<unknown>;
  setShipping?: React.Dispatch<React.SetStateAction<number>>;
  isBuyNow?: boolean;
} = {}) {
  const placeOrderMutation = { mutateAsync } as never;
  const view = render(
    <Provider store={store}>
      <OrderForm
        items={items}
        setShipping={setShipping}
        placeOrderMutation={placeOrderMutation}
        isBuyNow={isBuyNow}
      />
    </Provider>,
  );
  return { ...view, mutateAsync, setShipping };
}

describe("OrderForm", () => {
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
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  it("display error when order's information is invalid", async () => {
    store.dispatch(deleteInfo());
    renderForm();
    fireEvent.submit(document.getElementById("checkout-form")!);
    expect(
      await screen.findByText("Phone number must contains 10 numbers"),
    ).toBeVisible();
    expect(await screen.findAllByText("Please fill this field")).toHaveLength(
      2,
    );
  });

  it("uses profile values as defaults and reports invalid contact details", async () => {
    const user = userEvent.setup();
    renderForm();

    expect(screen.getByLabelText("Full Name")).toHaveValue("Keyboard Buyer");
    expect(screen.getByLabelText("Phone Number")).toHaveValue("0123456789");
    expect(screen.getByLabelText("Delivery Address")).toHaveValue(
      "123 Keyboard Street",
    );

    await user.clear(screen.getByLabelText("Phone Number"));
    await user.type(screen.getByLabelText("Phone Number"), "123");
    fireEvent.submit(document.getElementById("checkout-form")!);

    expect(
      await screen.findByText("Phone number must contains 10 numbers"),
    ).toBeVisible();
  });

  it("submits validated checkout data with variant IDs and selected shipping/payment", async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    const setShipping = vi.fn();
    renderForm({ mutateAsync, setShipping });

    await user.click(screen.getByRole("radio", { name: /Express Delivery/ }));
    expect(setShipping).toHaveBeenLastCalledWith(80);
    await user.click(screen.getByRole("radio", { name: /Standard Delivery/ }));
    expect(setShipping).toHaveBeenLastCalledWith(40);
    await user.click(screen.getByRole("radio", { name: /Banking transfer/ }));
    await user.click(screen.getByRole("radio", { name: /Cash on delivery/ }));
    expect(setShipping).toHaveBeenLastCalledWith(expect.any(Function));
    await user.type(
      screen.getByLabelText("Order Note (Optional)"),
      "Leave at reception",
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: /Save Shipping information/ }),
    );
    fireEvent.submit(document.getElementById("checkout-form")!);

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        name: "Keyboard Buyer",
        phone: "0123456789",
        address: "123 Keyboard Street",
        request: "Leave at reception",
        shipping: "Normal",
        payment: "COD",
        save: false,
        variantIds: [42, 43],
      }),
    );
  });
  it("uses discounted shipping fee for express delivery with bank payment", async () => {
    const user = userEvent.setup();
    const setShipping = vi.fn();

    renderForm({ setShipping });
    await user.click(screen.getByRole("radio", { name: /Banking transfer/ }));
    await user.click(screen.getByRole("radio", { name: /Express Delivery/ }));
    expect(setShipping).toHaveBeenLastCalledWith(40);
    await user.click(screen.getByRole("radio", { name: /Standard Delivery/ }));
    expect(setShipping).toHaveBeenLastCalledWith(20);
  });
  it("uses normal express shipping fee with COD payment", async () => {
    const user = userEvent.setup();
    const setShipping = vi.fn();

    renderForm({ setShipping });

    await user.click(screen.getByRole("radio", { name: /Express Delivery/ }));
    expect(setShipping).toHaveBeenLastCalledWith(80);
    await user.click(screen.getByRole("radio", { name: /Standard Delivery/ }));
    expect(setShipping).toHaveBeenLastCalledWith(40);
  });

  it("submits only the first prepared item as a buy-now payload", async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    renderForm({ mutateAsync, isBuyNow: true });

    fireEvent.submit(document.getElementById("checkout-form")!);

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          buyNow: { id: 42, qty: 2 },
        }),
      ),
    );
    expect(mutateAsync.mock.calls[0][0]).not.toHaveProperty("variantIds");
  });
});
