import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  EditProductFormDialog,
  type EditProductData,
} from "@/pages/admin/products/_components/EditProductFormDialog";

vi.mock("@/pages/admin/products/_components/EditorJsInput", () => ({
  EditorJsInput: () => <div data-testid="mock-editor">Editor</div>,
}));

vi.mock("@/hooks/useSaveEdit", () => ({
  useSaveEdit: () => ({
    isPending: false,
    mutate: vi.fn(),
  }),
}));

function createProduct(
  overrides: Partial<EditProductData> = {},
): EditProductData {
  return {
    ProductID: 25,
    Name: "Original Keyboard",
    Description: {
      blocks: [{ type: "paragraph", data: { text: "Description" } }],
    },
    ProductType: "KeyboardKit",
    SubType: "75%",
    variants: [
      {
        VariantID: 101,
        Color: "Black",
        Price: 1000,
        Stock: 4,
        MainImage: "/black.jpg",
      },
    ],
    images: ["/original-extra.jpg"],
    ...overrides,
  };
}

function renderDialog(productData: EditProductData) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <EditProductFormDialog
        productData={productData}
        open
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />
    </QueryClientProvider>,
  );
}

function uploadExtraImage(fileName: string) {
  const fileInputs = document.querySelectorAll('input[type="file"]');
  const fileInput = fileInputs.item(fileInputs.length - 1);
  if (!(fileInput instanceof HTMLInputElement)) {
    throw new Error("Extra image upload input was not rendered");
  }

  Object.defineProperty(fileInput, "files", {
    configurable: true,
    value: [new File(["image"], fileName, { type: "image/jpeg" })],
  });
  fireEvent.change(fileInput);
}

function removePreview(image: HTMLElement) {
  const removeButton = image.closest(".group")?.querySelector("button");
  if (!(removeButton instanceof HTMLButtonElement)) {
    throw new Error("Image remove button was not rendered");
  }
  fireEvent.click(removeButton);
}

function getPreviewByUrl(url: string) {
  const preview = screen
    .getAllByAltText("Extra image preview")
    .find((image) => image.getAttribute("src") === url);
  if (!preview) throw new Error(`Image preview ${url} was not rendered`);
  return preview;
}

describe("EditProductFormDialog", () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    let nextUrl = 0;
    createObjectURL = vi.fn(() => `blob:preview-${++nextUrl}`);
    revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("keeps preview URLs valid across renders and revokes them on removal and unmount", () => {
    const { unmount } = renderDialog(createProduct());

    uploadExtraImage("first.jpg");
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(
      screen.getAllByAltText("Extra image preview").map((image) =>
        image.getAttribute("src"),
      ),
    ).toContain("blob:preview-1");
    expect(getPreviewByUrl("blob:preview-1")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Product name"), {
      target: { value: "Edited locally" },
    });
    expect(revokeObjectURL).not.toHaveBeenCalled();

    removePreview(getPreviewByUrl("blob:preview-1"));
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");

    uploadExtraImage("second.jpg");
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenLastCalledWith("blob:preview-2");
  });

  it("initializes values from the selected product after the dialog is remounted", () => {
    const firstDialog = renderDialog(createProduct());
    uploadExtraImage("temporary.jpg");
    fireEvent.change(screen.getByPlaceholderText("Product name"), {
      target: { value: "Unsaved name" },
    });
    firstDialog.unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");

    const updatedProduct = createProduct({
      Name: "Updated product name",
      SubType: "TKL",
      images: ["/updated-extra.jpg"],
    });
    const secondDialog = renderDialog(updatedProduct);

    expect(screen.getByPlaceholderText("Product name")).toHaveValue(
      "Updated product name",
    );
    expect(screen.getByAltText("Extra image preview")).toHaveAttribute(
      "src",
      "/updated-extra.jpg",
    );
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);

    secondDialog.unmount();
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
  });
});
