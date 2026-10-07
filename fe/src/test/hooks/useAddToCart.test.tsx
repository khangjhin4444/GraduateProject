import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useAddToCart } from "@/hooks/useAddToCart"; // Cập nhật đường dẫn tương ứng
import { CartUsecase } from "@/features/cart/usecase/cart.usecase";

// 1. Giả lập module CartUsecase
vi.mock("@/features/cart/usecase/cart.usecase", () => ({
  CartUsecase: {
    addToCart: vi.fn(),
  },
}));

// Dữ liệu giỏ hàng khởi tạo mẫu (mock data)
const initialCart = {
  success: true,
  cartQuantity: 5, // Số lượng ban đầu
  items: [],
};

describe("useAddToCart Hook", () => {
  let queryClient: QueryClient;

  // 2. Thiết lập môi trường trước mỗi test
  beforeEach(() => {
    // Luôn tạo QueryClient mới để các test không bị dính cache của nhau
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Nạp sẵn dữ liệu ban đầu vào cache của React Query
    queryClient.setQueryData(["cart"], initialCart);

    // Theo dõi hành vi invalidateQueries
    vi.spyOn(queryClient, "invalidateQueries");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Tạo Wrapper để bọc hook
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  it("Initial cart cache empty, optimistic update success", async () => {
    queryClient.removeQueries({ queryKey: ["cart"] });
    vi.mocked(CartUsecase.addToCart).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true, message: "" }), 100),
        ),
    );
    const { result } = renderHook(() => useAddToCart(), { wrapper });

    const payload = { variantId: 1, quantity: 2 };

    // Kích hoạt mutation
    act(() => {
      result.current.mutate(payload);
    });
    await waitFor(() => {
      const optimisticCart: any = queryClient.getQueryData(["cart"]);
      expect(optimisticCart).toBeUndefined();
    });
  });

  it("thực hiện optimistic update tăng số lượng ngay lập tức và gọi API thành công", async () => {
    // Cấu hình mock API trả về thành công với độ trễ nhỏ để kịp kiểm tra optimistic update
    vi.mocked(CartUsecase.addToCart).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true, message: "" }), 100),
        ),
    );

    const { result } = renderHook(() => useAddToCart(), { wrapper });

    const payload = { variantId: 1, quantity: 2 };

    // Kích hoạt mutation
    act(() => {
      result.current.mutate(payload);
    });

    // 3. Kiểm tra Optimistic Update (Kiểm tra ngay lập tức mà không chờ API)
    // Giá trị ban đầu (5) + thêm (2) = 7
    await waitFor(() => {
      const optimisticCart: any = queryClient.getQueryData(["cart"]);
      expect(optimisticCart.cartQuantity).toBe(7);
    });

    // 4. Chờ mutation hoàn thành toàn bộ
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Kiểm tra API đã được gọi đúng tham số
    expect(CartUsecase.addToCart).toHaveBeenCalledWith(payload);

    // Kiểm tra onSettled đã gọi invalidateQueries để lấy data mới chưa
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["cart"],
    });
  });

  it("thực hiện rollback lại số lượng cũ nếu API trả về lỗi", async () => {
    // Cấu hình mock API trả về lỗi
    vi.mocked(CartUsecase.addToCart).mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Lỗi mạng")), 100),
        ),
    );

    const { result } = renderHook(() => useAddToCart(), { wrapper });

    act(() => {
      result.current.mutate({ variantId: 1, quantity: 2 });
    });

    // Optimistic Update diễn ra bình thường (lên 7)
    await waitFor(() => {
      let currentCart: any = queryClient.getQueryData(["cart"]);
      expect(currentCart.cartQuantity).toBe(7);
    });

    // Chờ đến khi mutation bị lỗi
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Kiểm tra Rollback: Số lượng phải quay về 5 như ban đầu
    const rollbackedCart: any = queryClient.getQueryData(["cart"]);
    expect(rollbackedCart.cartQuantity).toBe(5);

    // Dù lỗi nhưng onSettled vẫn phải gọi invalidate để sync lại với server
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["cart"],
    });
  });

  it("Rollback if API return error and initial cache is null", async () => {
    queryClient.removeQueries({ queryKey: ["cart"] });
    vi.mocked(CartUsecase.addToCart).mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Lỗi mạng")), 100),
        ),
    );

    const { result } = renderHook(() => useAddToCart(), { wrapper });

    act(() => {
      result.current.mutate({ variantId: 1, quantity: 2 });
    });
    await waitFor(() => {
      let currentCart: any = queryClient.getQueryData(["cart"]);
      expect(currentCart).toBeUndefined();
    });

    // Chờ đến khi mutation bị lỗi
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      let currentCart: any = queryClient.getQueryData(["cart"]);
      expect(currentCart).toBeUndefined();
    });

    await waitFor(() => {
      expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["cart"],
      });
    });
  });
  it("Only call invalidateQuery once after last mutation finish", async () => {
    let resolveFirstAPI: (value: any) => void;
    let resolveSecondAPI: (value: any) => void;

    vi.mocked(CartUsecase.addToCart)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirstAPI = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecondAPI = resolve;
          }),
      );

    const { result } = renderHook(() => useAddToCart(), { wrapper });

    act(() => {
      result.current.mutate({ variantId: 1, quantity: 1 });
      result.current.mutate({ variantId: 2, quantity: 2 });
    });
    await waitFor(() => {
      let currentCart: any = queryClient.getQueryData(["cart"]);
      expect(currentCart.cartQuantity).toBe(8);
    });
    act(() => {
      resolveFirstAPI({ success: true });
    });
    await waitFor(() => {
      expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    });
    act(() => {
      resolveSecondAPI({ success: true });
    });
    await waitFor(() => {
      expect(queryClient.invalidateQueries).toHaveBeenCalled();
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["cart"],
      });
    });
  });
});
