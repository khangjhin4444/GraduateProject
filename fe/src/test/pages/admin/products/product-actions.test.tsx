import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdminProductEntity } from "@/features/admin/schema/admin.schema";
import { AdminUsecase } from "@/features/admin/usecase/admin.usecase";
import { toast } from "sonner";
import { ProductActions } from "@/pages/admin/products/_components/product-actions";

vi.mock("@/features/admin/usecase/admin.usecase", () => ({
  AdminUsecase: { deleteProduct: vi.fn() },
}));
vi.mock("sonner", () => ({
  toast: {
    promise: vi.fn((promise: Promise<unknown>) => {
      void promise.catch(() => undefined);
    }),
  },
}));

const row: AdminProductEntity = {
  ProductID: 15,
  VariantID: 151,
  Name: "Keyboard",
  Description: { blocks: [{ type: "paragraph", data: { text: "Details" } }] },
  ProductType: "KeyboardKit",
  SubType: "75%",
  Color: "Black",
  Price: 1000,
  Stock: 3,
  MainImage: "/keyboard.jpg",
  ExtraImages: [],
};

function renderActions(onEdit = vi.fn()) {
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const view = render(
    <QueryClientProvider client={queryClient}>
      <ProductActions row={row} onEdit={onEdit} />
    </QueryClientProvider>,
  );
  return { ...view, onEdit, invalidate };
}

describe("ProductActions", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("calls the edit callback with the product ID", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    renderActions(onEdit);

    await user.click(screen.getByRole("button", { name: "Edit product" }));

    expect(onEdit).toHaveBeenCalledWith(row.ProductID);
  });

  it("requires a second click to delete, then notifies on successful deletion", async () => {
    const user = userEvent.setup();
    const { invalidate } = renderActions();
    vi.mocked(AdminUsecase.deleteProduct).mockResolvedValue({
      success: true,
      message: "Deleted",
    });

    await user.click(screen.getByRole("button", { name: "Delete product" }));
    expect(
      screen.getByRole("button", { name: "Confirm delete" }),
    ).toHaveAttribute("title", "Click again to confirm");
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => {
      expect(AdminUsecase.deleteProduct).toHaveBeenCalledWith(row.VariantID);
    });
    expect(toast.promise).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ["admin-products", row.ProductType],
      });
    });
  });

  it("resets confirmation after timeout and clears the timer when unmounted", async () => {
    const user = userEvent.setup();
    const { unmount } = renderActions();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    await user.click(screen.getByRole("button", { name: "Delete product" }));
    expect(screen.getByRole("button", { name: "Confirm delete" })).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 3100));
    expect(screen.getByRole("button", { name: "Delete product" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete product" }));
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("logs delete failures", async () => {
    const user = userEvent.setup();
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(AdminUsecase.deleteProduct).mockRejectedValue(
      new Error("Delete failed"),
    );
    renderActions();

    await user.click(screen.getByRole("button", { name: "Delete product" }));
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith(
        "Delete Failed: ",
        expect.objectContaining({ message: "Delete failed" }),
      );
    });
    logError.mockRestore();
  });
});
