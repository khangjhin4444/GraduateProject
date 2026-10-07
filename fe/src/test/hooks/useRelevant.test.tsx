import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductUsecase } from "@/features/product/usecase/product.usecase";
import useRelevant, { RelevantProductOptions } from "@/hooks/useRelevant";

vi.mock("@/features/product/usecase/product.usecase", () => ({
  ProductUsecase: {
    getRelevantProducts: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useRelevant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not fetch related products when disabled", () => {
    const { result } = renderHook(
      () => useRelevant({ type: "KeyboardKit", id: 5, enable: false }),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(ProductUsecase.getRelevantProducts).not.toHaveBeenCalled();
  });

  it("fetches related products when enabled", async () => {
    const params = { type: "KeyboardKit", id: 5, enable: true };
    const response = { success: true, data: [] };
    vi.mocked(ProductUsecase.getRelevantProducts).mockResolvedValue(response);
    const { result } = renderHook(() => useRelevant(params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(RelevantProductOptions(params).queryKey).toEqual([
      "relevant",
      "KeyboardKit",
      5,
    ]);
    expect(ProductUsecase.getRelevantProducts).toHaveBeenCalledWith({
      type: "KeyboardKit",
      id: 5,
    });
    expect(result.current.data).toEqual(response);
  });
});
