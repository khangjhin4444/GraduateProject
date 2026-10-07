import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminUsecase } from "@/features/admin/usecase/admin.usecase";
import type { ProductForm } from "@/pages/admin/products/_components/ProductFormDialog";
import { useSaveProduct } from "@/hooks/useSaveProduct";
import { toast } from "sonner";

vi.mock("@/features/admin/usecase/admin.usecase", () => ({
  AdminUsecase: {
    addProduct: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const variantImage = new File(["variant"], "variant.jpg", {
  type: "image/jpeg",
});
const extraImage = new File(["extra"], "extra.jpg", {
  type: "image/jpeg",
});

const productForm: ProductForm = {
  name: "New Keyboard",
  type: "KeyboardKit",
  subtype: "75%",
  description: {
    blocks: [{ type: "paragraph", data: { text: "Product details" } }],
  },
  variants: [
    {
      id: 1,
      color: "Black",
      price: 1000,
      stock: 5,
      file: variantImage,
      main_image: "",
    },
    {
      id: 2,
      color: "White",
      price: 1100,
      stock: 3,
      file: new File(["white"], "white.jpg", { type: "image/jpeg" }),
      main_image: "",
    },
  ],
  extraImages: [extraImage],
};

const noVariantImageProductForm: ProductForm = {
  name: "New Keyboard",
  type: "KeyboardKit",
  subtype: "75%",
  description: {
    blocks: [{ type: "paragraph", data: { text: "Product details" } }],
  },
  variants: [
    {
      id: 1,
      color: "Black",
      price: 1000,
      stock: 5,
      file: undefined,
      main_image: "",
    },
    {
      id: 2,
      color: "White",
      price: 1100,
      stock: 3,
      file: new File(["white"], "white.jpg", { type: "image/jpeg" }),
      main_image: "",
    },
  ],
  extraImages: [extraImage],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useSaveProduct", () => {
  const onOpenChange = vi.fn();
  const onSaved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AdminUsecase.addProduct).mockResolvedValue({
      success: true,
      message: "Product created",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates the product with multipart fields and notifies the caller", async () => {
    const { result } = renderHook(
      () => useSaveProduct({ onOpenChange, onSaved }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.mutateAsync(productForm);
    });

    expect(AdminUsecase.addProduct).toHaveBeenCalledOnce();
    const [formData] = vi.mocked(AdminUsecase.addProduct).mock.calls[0];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("name")).toBe("New Keyboard");
    expect(formData.get("productType")).toBe("KeyboardKit");
    expect(formData.get("subType")).toBe("75%");
    expect(formData.get("description")).toBe(
      JSON.stringify(productForm.description),
    );
    expect(JSON.parse(String(formData.get("variants")))).toEqual([
      { color: "Black", price: 1000, stock: 5 },
      { color: "White", price: 1100, stock: 3 },
    ]);
    expect(formData.getAll("variantImages")).toEqual([
      variantImage,
      productForm.variants[1].file,
    ]);
    expect(formData.getAll("extraImages")).toEqual([extraImage]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSaved).toHaveBeenCalledWith("KeyboardKit");
    expect(toast.success).toHaveBeenCalledWith("Product saved successfully!");
  });

  it("rejects duplicate variant colors without calling the API", async () => {
    const { result } = renderHook(
      () => useSaveProduct({ onOpenChange, onSaved }),
      { wrapper: createWrapper() },
    );
    const duplicateColorForm: ProductForm = {
      ...productForm,
      variants: [
        productForm.variants[0],
        { ...productForm.variants[1], color: " black " },
      ],
    };

    await act(async () => {
      await expect(
        result.current.mutateAsync(duplicateColorForm),
      ).rejects.toThrow("Validation failed: duplicate colors");
    });

    expect(AdminUsecase.addProduct).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Variant colors must be unique.");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("reports ordinary API errors and leaves the dialog open", async () => {
    const error = new Error("Create failed");
    vi.mocked(AdminUsecase.addProduct).mockRejectedValueOnce(error);
    const { result } = renderHook(
      () => useSaveProduct({ onOpenChange, onSaved }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await expect(result.current.mutateAsync(productForm)).rejects.toBe(error);
    });

    expect(toast.error).toHaveBeenCalledWith("Create failed");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("shows the server message for Axios errors", async () => {
    const error = new AxiosError(
      "Request failed",
      undefined,
      undefined,
      undefined,
      {
        data: { message: "Product could not be created" },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
    );
    vi.mocked(AdminUsecase.addProduct).mockRejectedValueOnce(error);
    const { result } = renderHook(
      () => useSaveProduct({ onOpenChange, onSaved }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await expect(result.current.mutateAsync(productForm)).rejects.toBe(error);
    });

    expect(toast.error).toHaveBeenCalledWith("Product could not be created");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });
  it("should not append undefined to variantImages", async () => {
    const { result } = renderHook(
      () => useSaveProduct({ onOpenChange, onSaved }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.mutateAsync(noVariantImageProductForm);
    });
    const [formData] = vi.mocked(AdminUsecase.addProduct).mock.calls[0];

    expect(formData.getAll("variantImages")).toEqual([
      productForm.variants[1].file,
    ]);
  });
});
