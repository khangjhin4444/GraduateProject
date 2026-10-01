import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CartItemEntity,
  GetCartResponseEntity,
} from "@/features/cart/schema/cart.schema";
import { CartUsecase } from "@/features/cart/usecase/cart.usecase";
import { SidebarProvider } from "@/components/ui/sidebar";
import Header from "@/components/Header/Header";
import { useCart } from "@/hooks/useCart";
import CartItem from "@/pages/HasHeader/cart/_components/CartItem";
import { store } from "@/state/store";
import { deleteToken, setToken } from "@/state/token/tokenSlice";

vi.mock("@/features/cart/usecase/cart.usecase", () => ({
  CartUsecase: {
    getCart: vi.fn(),
    changeItemQuantity: vi.fn(),
    deleteCartItem: vi.fn(),
    clearCartItem: vi.fn(),
  },
}));

const startingQuantity = 10;
const variantId = 42;

type Operation = "increase" | "decrease";

type PendingRequest = {
  quantity: number;
  resolve: () => void;
  reject: () => void;
};

type FailurePattern = {
  name: string;
  failures: number[];
};

const failurePatterns: FailurePattern[] = [
  { name: "request 1 fails", failures: [0] },
  { name: "request 2 fails", failures: [1] },
  { name: "request 3 fails", failures: [2] },
  { name: "requests 1 and 2 fail", failures: [0, 1] },
  { name: "requests 1 and 3 fail", failures: [0, 2] },
  { name: "requests 2 and 3 fail", failures: [1, 2] },
  { name: "all requests fail", failures: [0, 1, 2] },
];

const operationPatterns: { name: string; operations: Operation[] }[] = [
  {
    name: "three increases",
    operations: ["increase", "increase", "increase"],
  },
  {
    name: "three decreases",
    operations: ["decrease", "decrease", "decrease"],
  },
  {
    name: "increase, decrease, increase",
    operations: ["increase", "decrease", "increase"],
  },
  {
    name: "decrease, increase, decrease",
    operations: ["decrease", "increase", "decrease"],
  },
];

const testCases = operationPatterns.flatMap((operationPattern) =>
  failurePatterns.map((failurePattern) => ({
    name: `${operationPattern.name}; ${failurePattern.name}`,
    operations: operationPattern.operations,
    failures: failurePattern.failures,
  })),
);

const cartItem: CartItemEntity = {
  CartItemID: 7,
  Quantity: startingQuantity,
  MainImage: "/keyboard.jpg",
  Price: "1000",
  Name: "Test Keyboard",
  Color: "Black",
  Stock: 20,
  VariantID: variantId,
  ProductType: "KeyboardKit",
  SubType: "75%",
};

let serverQuantity = startingQuantity;
let pendingRequests: PendingRequest[];

function makeCart(quantity: number): GetCartResponseEntity {
  return {
    success: true,
    message: "Cart loaded",
    warnings: 0,
    cartQuantity: quantity,
    items: [{ ...cartItem, Quantity: quantity }],
  };
}

function CartHarness() {
  const { data: cart } = useCart();

  return (
    <>
      <Header />
      {cart.items.map((item) => (
        <CartItem
          key={item.CartItemID}
          item={{ ...item, isChecked: true }}
          handleToggleCheck={() => {}}
        />
      ))}
    </>
  );
}

function renderCart() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
  queryClient.setQueryData(["cart"], makeCart(startingQuantity));

  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SidebarProvider>
            <CartHarness />
          </SidebarProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );

  return queryClient;
}

function readHeaderQuantity() {
  const cartButton = screen.getByRole("button", { name: "cart-btn" });
  return within(cartButton).getByText(/\d+/);
}

function getRequestedQuantities(operations: Operation[]) {
  let quantity = startingQuantity;
  return operations.map((operation) => {
    quantity += operation === "increase" ? 1 : -1;
    return quantity;
  });
}

describe("CartItem optimistic quantity updates", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    serverQuantity = startingQuantity;
    pendingRequests = [];

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    store.dispatch(setToken("test-token"));
    vi.mocked(CartUsecase.getCart).mockImplementation(async () =>
      makeCart(serverQuantity),
    );
    vi.mocked(CartUsecase.changeItemQuantity).mockImplementation(
      ({ quantity }) =>
        new Promise((resolve, reject) => {
          pendingRequests.push({
            quantity,
            resolve: () => {
              serverQuantity = quantity;
              resolve({ success: true, message: "Quantity updated" });
            },
            reject: () => reject(new Error("Quantity update failed")),
          });
        }),
    );
  });

  afterEach(() => {
    cleanup();
    store.dispatch(deleteToken());
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it.each(testCases)(
    "keeps header count correct: $name",
    async ({ operations, failures }) => {
      renderCart();

      const requestedQuantities = getRequestedQuantities(operations);
      for (const operation of operations) {
        await act(async () => {
          fireEvent.click(
            screen.getByRole("button", {
              name:
                operation === "increase"
                  ? "Increase quantity"
                  : "Decrease quantity",
            }),
          );
        });
        await act(async () => {
          await vi.advanceTimersByTimeAsync(500);
        });
      }

      const optimisticQuantity = requestedQuantities.at(-1)!;
      expect(readHeaderQuantity()).toHaveTextContent(
        String(optimisticQuantity),
      );
      expect(screen.getByRole("spinbutton")).toHaveValue(optimisticQuantity);
      expect(pendingRequests).toHaveLength(1);

      for (let requestIndex = 0; requestIndex < 3; requestIndex += 1) {
        expect(pendingRequests).toHaveLength(requestIndex + 1);

        await act(async () => {
          if (failures.includes(requestIndex)) {
            pendingRequests[requestIndex].reject();
          } else {
            pendingRequests[requestIndex].resolve();
          }
          await vi.advanceTimersByTimeAsync(0);
        });
        if (requestIndex < 2) {
          expect(pendingRequests).toHaveLength(requestIndex + 2);
        }
      }

      const lastSuccessfulRequest = requestedQuantities.findLastIndex(
        (_, index) => !failures.includes(index),
      );
      const expectedServerQuantity =
        lastSuccessfulRequest === -1
          ? startingQuantity
          : requestedQuantities[lastSuccessfulRequest];

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(readHeaderQuantity()).toHaveTextContent(
        String(expectedServerQuantity),
      );
      expect(screen.getByRole("spinbutton")).toHaveValue(
        expectedServerQuantity,
      );
      expect(CartUsecase.changeItemQuantity).toHaveBeenCalledTimes(3);
      requestedQuantities.forEach((quantity, index) => {
        expect(CartUsecase.changeItemQuantity).toHaveBeenNthCalledWith(
          index + 1,
          expect.objectContaining({ variantId, quantity }),
        );
      });
    },
  );
});
