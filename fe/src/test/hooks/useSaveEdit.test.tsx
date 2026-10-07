import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { AdminUsecase } from "@/features/admin/usecase/admin.usecase";
import type { EditProductForm } from "@/pages/admin/products/_components/EditProductFormDialog";
import { useSaveEdit } from "@/hooks/useSaveEdit";
import { toast } from "sonner";

vi.mock("@/features/admin/usecase/admin.usecase", () => ({
  AdminUsecase: {
    editProduct: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const formData: EditProductForm = {
  name: "Updated Keyboard",
  type: "KeyboardKit",
  subtype: "75%",
  description: {
    blocks: [{ type: "paragraph", data: { text: "Updated description" } }],
  },
  variants: [
    {
      variantId: 5,
      color: " Black ",
      price: 1200,
      stock: 4,
      existingImage: "/black.jpg",
    },
    {
      color: "White",
      price: 1300,
      stock: 3,
      file: new File(["image"], "white.jpg", { type: "image/jpeg" }),
    },
  ],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("useSaveEdit", () => {
  const onOpenChange = vi.fn();
  const onSaved = vi.fn();
  const extraImageFile = new File(["extra"], "extra.jpg", {
    type: "image/jpeg",
  });
  const options = {
    productId: 25,
    oldVariants: [
      { id: 99, color: "black" },
      { id: 100, color: "Red" },
    ],
    extraImages: [
      { type: "existing" as const, url: "/existing.jpg" },
      { type: "new" as const, file: extraImageFile, previewUrl: "blob:extra" },
    ],
    onOpenChange,
    onSaved,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AdminUsecase.editProduct).mockResolvedValue({
      success: true,
      message: "Updated",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("builds multipart data, updates callbacks, and reports success", async () => {
    const { result } = renderHook(() => useSaveEdit(options), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(formData);
    });

    expect(AdminUsecase.editProduct).toHaveBeenCalledOnce();
    const [productId, submittedFormData] = vi.mocked(
      AdminUsecase.editProduct,
    ).mock.calls[0];
    expect(productId).toBe(25);
    expect(submittedFormData).toBeInstanceOf(FormData);
    expect(submittedFormData.get("name")).toBe("Updated Keyboard");
    expect(submittedFormData.get("productType")).toBe("KeyboardKit");
    expect(submittedFormData.get("subType")).toBe("75%");
    expect(submittedFormData.get("description")).toBe(
      JSON.stringify(formData.description),
    );
    expect(JSON.parse(String(submittedFormData.get("variants")))).toEqual([
      {
        variantId: 99,
        color: " Black ",
        price: 1200,
        stock: 4,
        existingImage: "/black.jpg",
      },
      {
        variantId: undefined,
        color: "White",
        price: 1300,
        stock: 3,
        existingImage: undefined,
      },
    ]);
    expect(submittedFormData.getAll("variantImages")).toEqual([
      formData.variants[1].file,
    ]);
    expect(submittedFormData.get("existingExtraImages")).toBe(
      JSON.stringify(["/existing.jpg"]),
    );
    expect(submittedFormData.getAll("extraImages")).toEqual([extraImageFile]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSaved).toHaveBeenCalledWith("KeyboardKit");
    expect(toast.success).toHaveBeenCalledWith(
      "Product updated successfully!",
    );
  });

  it("rejects duplicate variant colors without calling the API", async () => {
    const { result } = renderHook(() => useSaveEdit(options), {
      wrapper: createWrapper(),
    });
    const duplicateColorForm: EditProductForm = {
      ...formData,
      variants: [
        formData.variants[0],
        { ...formData.variants[1], color: "black" },
      ],
    };

    await act(async () => {
      await expect(
        result.current.mutateAsync(duplicateColorForm),
      ).rejects.toThrow("Validation failed: duplicate colors");
    });

    expect(AdminUsecase.editProduct).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      "Variant colors must be unique.",
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("reports API errors and leaves the dialog open", async () => {
    const error = new Error("Update failed");
    vi.mocked(AdminUsecase.editProduct).mockRejectedValueOnce(error);
    const { result } = renderHook(() => useSaveEdit(options), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await expect(result.current.mutateAsync(formData)).rejects.toBe(error);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Update failed");
    });
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
        data: { message: "Product could not be updated" },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
    );
    vi.mocked(AdminUsecase.editProduct).mockRejectedValueOnce(error);
    const { result } = renderHook(() => useSaveEdit(options), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await expect(result.current.mutateAsync(formData)).rejects.toBe(error);
    });

    expect(toast.error).toHaveBeenCalledWith("Product could not be updated");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
