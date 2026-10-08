import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CartItemEntity,
  GetCartResponseEntity,
} from "@/features/cart/schema/cart.schema";
import { CartUsecase } from "@/features/cart/usecase/cart.usecase";
import { useCartItem } from "@/hooks/useCartItem";
import { toast } from "sonner";

vi.mock("@/features/cart/usecase/cart.usecase", () => ({
  CartUsecase: {
    changeItemQuantity: vi.fn(),
    deleteCartItem: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

const item: CartItemEntity = {
  CartItemID: 7,
  Quantity: 3,
  MainImage: "/keyboard.jpg",
  Price: "1000",
  Name: "Test Keyboard",
  Color: "Black",
  Stock: 10,
  VariantID: 42,
  ProductType: "KeyboardKit",
  SubType: "75%",
};

const otherItem: CartItemEntity = {
  ...item,
  CartItemID: 8,
  VariantID: 43,
  Quantity: 2,
  Name: "Other Keyboard",
};

function makeCart(items: CartItemEntity[] = [item, otherItem]) {
  return {
    success: true,
    message: "Cart loaded",
    warnings: 0,
    cartQuantity: items.reduce(
      (quantity, cartItem) => quantity + cartItem.Quantity,
      0,
    ),
    items,
  } satisfies GetCartResponseEntity;
}

function makeCartNotHaveItem(items: CartItemEntity[] = [otherItem]) {
  return {
    success: true,
    message: "Cart loaded",
    warnings: 0,
    cartQuantity: items.reduce(
      (quantity, cartItem) => quantity + cartItem.Quantity,
      0,
    ),
    items,
  } satisfies GetCartResponseEntity;
}

async function flushMicrotasks() {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
  }
}

describe("useCartItem", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.useFakeTimers();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(["cart"], makeCart());
    vi.spyOn(queryClient, "invalidateQueries");
    vi.mocked(CartUsecase.changeItemQuantity).mockResolvedValue({
      success: true,
      message: "Quantity updated",
    });
    vi.mocked(CartUsecase.deleteCartItem).mockResolvedValue({
      success: true,
      message: "Item deleted",
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  function createWrapper() {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };
  }

  it("debounces rapid quantity changes and updates the cart cache optimistically", async () => {
    const { result } = renderHook(() => useCartItem(item), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleQuantityChange("increase");
      result.current.handleQuantityChange("increase");
    });

    expect(result.current.quantityInput).toBe("5");
    const optimisticCart = queryClient.getQueryData<GetCartResponseEntity>([
      "cart",
    ]);
    expect(optimisticCart?.cartQuantity).toBe(7);
    expect(
      optimisticCart?.items.find(
        (cartItem) => cartItem.VariantID === item.VariantID,
      )?.Quantity,
    ).toBe(5);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(499);
    });
    expect(CartUsecase.changeItemQuantity).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
      await flushMicrotasks();
    });
    expect(CartUsecase.changeItemQuantity).toHaveBeenCalledOnce();
    expect(CartUsecase.changeItemQuantity).toHaveBeenCalledWith({
      variantId: item.VariantID,
      quantity: 5,
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["cart"],
    });
  });

  it("clamps valid input to stock and cancels a pending update for invalid input (case quantity < 1)", async () => {
    const { result } = renderHook(() => useCartItem(item), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleQuantityChange("input", "99");
    });

    expect(result.current.quantityInput).toBe("10");
    expect(
      queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.items[0],
    ).toMatchObject({ VariantID: item.VariantID, Quantity: 10 });

    act(() => {
      result.current.handleQuantityChange("input", "0");
    });
    expect(result.current.quantityInput).toBe("0");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(CartUsecase.changeItemQuantity).not.toHaveBeenCalled();
    expect(
      queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.items[0]
        ?.Quantity,
    ).toBe(3);
  });

  it("clamps valid input to stock and cancels a pending update for invalid input(case value='')", async () => {
    const { result } = renderHook(() => useCartItem(item), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleQuantityChange("input", "99");
    });

    expect(result.current.quantityInput).toBe("10");
    expect(
      queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.items[0],
    ).toMatchObject({ VariantID: item.VariantID, Quantity: 10 });

    act(() => {
      result.current.handleQuantityChange("input", "");
    });
    expect(result.current.quantityInput).toBe("");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(CartUsecase.changeItemQuantity).not.toHaveBeenCalled();
    expect(
      queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.items[0]
        ?.Quantity,
    ).toBe(3);
  });

  it("clamps valid input to stock and cancels a pending update for invalid input (case value is not an integer)", async () => {
    const { result } = renderHook(() => useCartItem(item), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleQuantityChange("input", "99");
    });

    expect(result.current.quantityInput).toBe("10");
    expect(
      queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.items[0],
    ).toMatchObject({ VariantID: item.VariantID, Quantity: 10 });

    act(() => {
      result.current.handleQuantityChange("input", "1.5");
    });
    expect(result.current.quantityInput).toBe("1.5");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(CartUsecase.changeItemQuantity).not.toHaveBeenCalled();
    expect(
      queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.items[0]
        ?.Quantity,
    ).toBe(3);
  });

  it("clamps valid input to stock and cancels a pending update for invalid input (case stock < 1)", async () => {
    const { result } = renderHook(() => useCartItem({ ...item, Stock: 0 }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleQuantityChange("input", "99");
    });

    expect(result.current.quantityInput).toBe("99");
    expect(
      queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.items[0],
    ).toMatchObject({ VariantID: item.VariantID, Quantity: 3 });
  });

  it("does not update quantity when input is omitted or unchanged", () => {
    const { result } = renderHook(() => useCartItem(item), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleQuantityChange("input");
      result.current.handleQuantityChange("input", "3");
    });

    expect(result.current.quantityInput).toBe("3");
    expect(
      queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.cartQuantity,
    ).toBe(5);
  });

  it("decreases quantity but never allows it below one", () => {
    const { result, rerender } = renderHook(
      (currentItem) => useCartItem(currentItem),
      {
        initialProps: item,
        wrapper: createWrapper(),
      },
    );

    act(() => {
      result.current.handleQuantityChange("decrease");
    });
    expect(result.current.quantityInput).toBe("2");
    expect(
      queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.cartQuantity,
    ).toBe(4);

    rerender({ ...item, Quantity: 1 });
    act(() => {
      result.current.handleQuantityChange("decrease");
    });
    expect(result.current.quantityInput).toBe("1");
    expect(result.current.canDecrease).toBe(false);
  });

  it("rolls back optimistic quantity and reports the mutation error", async () => {
    vi.mocked(CartUsecase.changeItemQuantity).mockRejectedValueOnce(
      new Error("Quantity update failed"),
    );
    const { result } = renderHook(() => useCartItem(item), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleQuantityChange("increase");
    });
    expect(
      queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.items[0]
        ?.Quantity,
    ).toBe(4);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
      await flushMicrotasks();
    });
    expect(result.current.quantityInput).toBe("3");
    expect(
      queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.items[0]
        ?.Quantity,
    ).toBe(3);
    expect(toast.error).toHaveBeenCalledExactlyOnceWith(
      "Quantity update failed",
    );
  });

  it("optimistically removes an item and restores its position on delete failure", async () => {
    let rejectDelete!: (error: Error) => void;
    vi.mocked(CartUsecase.deleteCartItem).mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectDelete = reject;
        }),
    );
    const { result } = renderHook(() => useCartItem(item), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.deleteItem();
    });
    await act(async () => {
      await flushMicrotasks();
    });
    expect(
      queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.items,
    ).toEqual([otherItem]);
    expect(
      queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.cartQuantity,
    ).toBe(2);

    await act(async () => {
      rejectDelete(new Error("Delete failed"));
      await flushMicrotasks();
    });
    expect(
      queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.items,
    ).toEqual([item, otherItem]);
    expect(
      queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.cartQuantity,
    ).toBe(5);
    expect(toast.error).toHaveBeenCalledExactlyOnceWith("Delete failed");
  });

  it("handles a failed delete when the item is not in the cart cache", async () => {
    vi.mocked(CartUsecase.deleteCartItem).mockRejectedValueOnce(
      new Error("Delete failed"),
    );
    queryClient.setQueryData(["cart"], makeCartNotHaveItem());
    const { result } = renderHook(() => useCartItem(item), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.deleteItem();
      await flushMicrotasks();
    });

    expect(
      queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.items,
    ).toEqual([otherItem]);
    expect(toast.error).toHaveBeenCalledExactlyOnceWith("Delete failed");
  });

  it("handles a failed delete when the cart cache is missing", async () => {
    vi.mocked(CartUsecase.deleteCartItem).mockRejectedValueOnce(
      new Error("Delete failed"),
    );
    queryClient.removeQueries({ queryKey: ["cart"] });
    const { result } = renderHook(() => useCartItem(item), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.deleteItem();
      await flushMicrotasks();
    });

    expect(queryClient.getQueryData(["cart"])).toBeUndefined();
    expect(toast.error).toHaveBeenCalledExactlyOnceWith("Delete failed");
  });

  it("does not restore a deleted item if the cart cache disappears before the request fails", async () => {
    let rejectDelete!: (error: Error) => void;
    vi.mocked(CartUsecase.deleteCartItem).mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectDelete = reject;
        }),
    );
    const { result } = renderHook(() => useCartItem(item), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.deleteItem();
      await flushMicrotasks();
    });
    queryClient.removeQueries({ queryKey: ["cart"] });

    await act(async () => {
      rejectDelete(new Error("Delete failed"));
      await flushMicrotasks();
    });

    expect(queryClient.getQueryData(["cart"])).toBeUndefined();
  });

  it("cancels a debounced quantity mutation when the item is deleted", async () => {
    const { result } = renderHook(() => useCartItem(item), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.handleQuantityChange("increase");
      result.current.deleteItem();
      await flushMicrotasks();
    });

    expect(CartUsecase.deleteCartItem).toHaveBeenCalledWith({
      variantId: item.VariantID,
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(CartUsecase.changeItemQuantity).not.toHaveBeenCalled();
  });

  it("flushes a pending quantity mutation when the hook unmounts", async () => {
    const { result, unmount } = renderHook(() => useCartItem(item), {
      wrapper: createWrapper(),
    });
    act(() => {
      result.current.handleQuantityChange("increase");
    });

    await act(async () => {
      unmount();
      await flushMicrotasks();
    });
    expect(CartUsecase.changeItemQuantity).toHaveBeenCalledWith(
      expect.objectContaining({
        variantId: item.VariantID,
        quantity: 4,
      }),
    );
  });
  describe("when waiting for delete api to fail, cart cache revalidate", () => {
    it("should not insert duplicate deleted item", async () => {
      let rejectDelete!: (error: Error) => void;
      vi.mocked(CartUsecase.deleteCartItem).mockImplementation(
        () =>
          new Promise((_, reject) => {
            rejectDelete = reject;
          }),
      );
      const { result } = renderHook(() => useCartItem(item), {
        wrapper: createWrapper(),
      });
      await act(async () => {
        result.current.deleteItem();
        await flushMicrotasks();
      });
      expect(
        queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.items,
      ).toEqual([otherItem]);
      expect(
        queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.cartQuantity,
      ).toBe(2);
      queryClient.setQueryData(["cart"], makeCart());
      await act(async () => {
        rejectDelete(new Error("Delete failed"));
        await flushMicrotasks();
      });
      expect(
        queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.items,
      ).toEqual([item, otherItem]);
      expect(
        queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.cartQuantity,
      ).toBe(5);
    });
  });
  it("set input focus ref to true when input focus", () => {
    const { result, rerender } = renderHook((props) => useCartItem(props), {
      initialProps: item,
      wrapper: createWrapper(),
    });
    act(() => {
      result.current.handleInputFocus();
    });
    const updatedItem = { ...item, Quantity: 10 };
    rerender(updatedItem);
    expect(result.current.quantityInput).toBe("3");
    act(() => {
      result.current.handleInputBlur();
    });

    expect(result.current.quantityInput).toBe("10");
  });

  it("skip update cart cache (to not crash) if cart cache is undefine", () => {
    const { result } = renderHook(() => useCartItem(item), {
      wrapper: createWrapper(),
    });
    queryClient.removeQueries({ queryKey: ["cart"] });
    act(() => {
      result.current.handleQuantityChange("increase");
    });
    expect(queryClient.getQueryData(["cart"])).toBeUndefined();
  });
  it("skip update (to not crash) if item is not in cart cache", () => {
    const { result } = renderHook(() => useCartItem(item), {
      wrapper: createWrapper(),
    });
    queryClient.setQueriesData({ queryKey: ["cart"] }, makeCartNotHaveItem());
    act(() => {
      result.current.handleQuantityChange("increase");
    });
    expect(queryClient.getQueryData(["cart"])).toEqual({
      success: true,
      message: "Cart loaded",
      warnings: 0,
      cartQuantity: 2,
      items: [
        {
          CartItemID: 8,
          Quantity: 2,
          MainImage: "/keyboard.jpg",
          Price: "1000",
          Name: "Other Keyboard",
          Color: "Black",
          Stock: 10,
          VariantID: 43,
          ProductType: "KeyboardKit",
          SubType: "75%",
        },
      ],
    });
  });
  it("shouldn't rollback on error if different version", async () => {
    let rejectedAPI: (
      value:
        | PromiseLike<{
            success: boolean;
            message: string;
          }>
        | {
            success: boolean;
            message: string;
          },
    ) => void;
    vi.mocked(CartUsecase.changeItemQuantity).mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectedAPI = reject;
        }),
    );
    const { result } = renderHook(() => useCartItem(item), {
      wrapper: createWrapper(),
    });
    act(() => {
      result.current.handleQuantityChange("increase");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(CartUsecase.changeItemQuantity).toHaveBeenCalled();
    act(() => {
      result.current.handleQuantityChange("increase");
    });
    expect(
      queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.cartQuantity,
    ).toBe(7);
    await act(async () => {
      rejectedAPI({ success: false, message: "Fail" });
      await flushMicrotasks();
    });
    expect(
      queryClient.getQueryData<GetCartResponseEntity>(["cart"])?.cartQuantity,
    ).toBe(7);
  });
});
