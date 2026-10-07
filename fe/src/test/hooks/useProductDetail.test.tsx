import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductUsecase } from "@/features/product/usecase/product.usecase";
import useProductDetail, {
  productDetailOptions,
} from "@/hooks/useProductDetail";

vi.mock("@/features/product/usecase/product.usecase", () => ({
  ProductUsecase: {
    getProductDetail: vi.fn(),
  },
}));

const productDetail = {
  success: true,
  data: {
    ProductID: 5,
    Name: "Test Keyboard",
    ProductType: "KeyboardKit",
    Description: { blocks: [{ type: "paragraph", data: { text: "Details" } }] },
    SubType: "75%",
    images: ["/keyboard.jpg"],
    variants: [
      {
        VariantID: 52,
        Color: "Black",
        Price: 1200,
        Stock: 3,
        MainImage: "/keyboard.jpg",
      },
    ],
  },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={null}>{children}</Suspense>
      </QueryClientProvider>
    );
  };
}

describe("useProductDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the product id in its key and returns product details", async () => {
    vi.mocked(ProductUsecase.getProductDetail).mockResolvedValue(productDetail);
    const { result } = renderHook(() => useProductDetail(5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual(productDetail));
    expect(productDetailOptions(5).queryKey).toEqual(["product", 5]);
    expect(ProductUsecase.getProductDetail).toHaveBeenCalledWith(5);
  });
});
