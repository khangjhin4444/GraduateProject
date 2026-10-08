import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Suspense } from "react";
import { useCart } from "@/hooks/useCart";
import { CartUsecase } from "@/features/cart/usecase/cart.usecase";
import { toast } from "sonner";

vi.mock("@/features/cart/usecase/cart.usecase", () => ({
  CartUsecase: {
    getCart: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
  },
}));

describe("useCart Hook", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // 3. Tạo Wrapper có chứa <Suspense> để xử lý useSuspenseQuery
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </QueryClientProvider>
  );

  it("Returns cart data if warning = 0", async () => {
    const mockData = { items: [], warnings: 0, cartQuantity: 0 };
    vi.mocked(CartUsecase.getCart).mockResolvedValueOnce(mockData as any);

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data).toEqual(mockData);

    expect(toast.info).not.toHaveBeenCalled();
  });

  it("toast called with 1 item if warning = 3", async () => {
    const mockData = { items: [], warnings: 1, cartQuantity: 1 };
    vi.mocked(CartUsecase.getCart).mockResolvedValueOnce(mockData as any);

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(toast.info).toHaveBeenCalledExactlyOnceWith(
      "1 item's quantity reduce due to current Stock",
    );
  });

  it("toast called with items if warnings > 1", async () => {
    const mockData = { items: [], warnings: 3, cartQuantity: 3 };
    vi.mocked(CartUsecase.getCart).mockResolvedValueOnce(mockData as any);

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(toast.info).toHaveBeenCalledExactlyOnceWith(
      "3 items's quantity reduce due to current Stock",
    );
  });
});
