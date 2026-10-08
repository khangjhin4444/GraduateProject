import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  EditProductFormDialog,
  type EditProductData,
} from "@/pages/admin/products/_components/EditProductFormDialog";

const { editorSave, mutate, mutationState } = vi.hoisted(() => ({
  editorSave: vi.fn(),
  mutate: vi.fn(),
  mutationState: { isPending: false },
}));

vi.mock("@/pages/admin/products/_components/EditorJsInput", async () => {
  const React = await import("react");
  return {
    EditorJsInput: React.forwardRef(function MockEditor(_, ref) {
      React.useImperativeHandle(ref, () => ({ save: editorSave }));
      return <div data-testid="mock-editor">Editor</div>;
    }),
  };
});

vi.mock("@/hooks/useSaveEdit", () => ({
  useSaveEdit: () => ({
    isPending: mutationState.isPending,
    mutate,
  }),
}));

const validDescription = {
  blocks: [{ type: "paragraph", data: { text: "Updated description" } }],
};

function setInputFile(input: HTMLInputElement, file: File) {
  Object.defineProperty(input, "files", {
    configurable: true,
    value: [file],
  });
  fireEvent.change(input);
}

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
  const onOpenChange = vi.fn();
  const onSaved = vi.fn();
  const view = render(
    <QueryClientProvider client={queryClient}>
      <EditProductFormDialog
        productData={productData}
        open
        onOpenChange={onOpenChange}
        onSaved={onSaved}
      />
    </QueryClientProvider>,
  );
  return { ...view, onOpenChange, onSaved };
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
    vi.clearAllMocks();
    mutationState.isPending = false;
    editorSave.mockResolvedValue(validDescription);
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
      screen
        .getAllByAltText("Extra image preview")
        .map((image) => image.getAttribute("src")),
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

  it("submits valid edits with the description saved from the editor", async () => {
    const user = userEvent.setup();
    const { onOpenChange, onSaved } = renderDialog(createProduct());
    const updatedDescription = {
      blocks: [{ type: "paragraph", data: { text: "From editor" } }],
    };
    editorSave.mockResolvedValueOnce(updatedDescription);

    await user.clear(screen.getByPlaceholderText("Product name"));
    await user.type(
      screen.getByPlaceholderText("Product name"),
      "Updated Keyboard",
    );
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(mutate).toHaveBeenCalledOnce());
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Updated Keyboard",
        description: updatedDescription,
        variants: [
          expect.objectContaining({
            variantId: 101,
            color: "Black",
            existingImage: "/black.jpg",
          }),
        ],
      }),
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("submits using the existing description when the editor returns no data", async () => {
    editorSave.mockResolvedValueOnce(undefined);
    renderDialog(createProduct());

    fireEvent.submit(
      screen.getByRole("button", { name: "Save Changes" }).closest("form")!,
    );

    await waitFor(() => expect(mutate).toHaveBeenCalledOnce());
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        description: createProduct().Description,
      }),
    );
  });

  it.each([
    [new Error("Editor save failed"), "Editor save failed"],
    ["unexpected failure", "Unable to save the product description"],
  ])(
    "shows editor save errors and does not submit the form",
    async (error, expectedMessage) => {
      editorSave.mockRejectedValueOnce(error);
      renderDialog(createProduct());

      fireEvent.submit(
        screen.getByRole("button", { name: "Save Changes" }).closest("form")!,
      );

      expect(await screen.findByText(expectedMessage)).toBeVisible();
      expect(mutate).not.toHaveBeenCalled();
    },
  );

  it("shows description validation errors returned by the editor", async () => {
    editorSave.mockResolvedValueOnce({ blocks: [] });
    renderDialog(createProduct());

    fireEvent.submit(
      screen.getByRole("button", { name: "Save Changes" }).closest("form")!,
    );

    expect(
      await screen.findByText("Please enter a product description"),
    ).toBeVisible();
    expect(mutate).not.toHaveBeenCalled();
  });

  // it("uses the fallback description message for a nested block error", async () => {
  //   editorSave.mockResolvedValueOnce({ blocks: [null] });
  //   renderDialog(createProduct());

  //   fireEvent.submit(
  //     screen.getByRole("button", { name: "Save Changes" }).closest("form")!,
  //   );

  //   expect(
  //     await screen.findByText("Please enter a product description"),
  //   ).toBeVisible();
  //   expect(mutate).not.toHaveBeenCalled();
  // });

  it("shows field validation errors when another field is invalid", async () => {
    renderDialog(
      createProduct({
        variants: [
          {
            VariantID: 101,
            Color: "",
            Price: 0,
            Stock: -1,
            MainImage: "",
          },
        ],
      }),
    );

    fireEvent.change(screen.getByPlaceholderText("Product name"), {
      target: { value: "" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Save Changes" }).closest("form")!,
    );

    expect(await screen.findByText("Please fill this field")).toBeVisible();
    expect(await screen.findByText("Color is required")).toBeVisible();
    expect(await screen.findByText("Price must be at least 1")).toBeVisible();
    expect(await screen.findByText("Stock cannot be negative")).toBeVisible();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("updates subtype options when the product type changes", async () => {
    const user = userEvent.setup();
    renderDialog(createProduct());
    const [typeSelect, subtypeSelect] = screen.getAllByRole("combobox");

    await user.click(typeSelect);
    await user.click(await screen.findByRole("option", { name: "Keycap" }));
    expect(typeSelect).toHaveTextContent("Keycap");
    expect(subtypeSelect).toHaveTextContent("Cherry");

    await user.click(subtypeSelect);
    await user.click(await screen.findByRole("option", { name: "SA" }));
    expect(subtypeSelect).toHaveTextContent("SA");
  });

  it("adds a variant, permits removing it, and keeps one variant", async () => {
    const user = userEvent.setup();
    renderDialog(createProduct());
    const firstRemove = screen
      .getAllByRole("button", { name: "" })
      .find((button) => button.querySelector("svg.lucide-trash-2"));
    expect(firstRemove).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /Add variant/i }));
    expect(screen.getAllByPlaceholderText("Black")).toHaveLength(2);
    const removeButtons = screen
      .getAllByRole("button", { name: "" })
      .filter((button) => button.querySelector("svg.lucide-trash-2"));
    expect(removeButtons[1]).toBeEnabled();
    await user.click(removeButtons[1]);
    expect(screen.getAllByPlaceholderText("Black")).toHaveLength(1);
    expect(
      screen
        .getAllByRole("button", { name: "" })
        .find((button) => button.querySelector("svg.lucide-trash-2")),
    ).toBeDisabled();
  });

  it("accepts a main-image upload for a newly added variant", async () => {
    const user = userEvent.setup();
    const { unmount } = renderDialog(createProduct());
    await user.click(screen.getByRole("button", { name: /Add variant/i }));
    const mainImageInput = document.querySelectorAll<HTMLInputElement>(
      'input[type="file"][accept="image/*"]',
    )[1];

    setInputFile(
      mainImageInput,
      new File(["variant"], "variant.jpg", { type: "image/jpeg" }),
    );

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(
      screen
        .getAllByAltText("Preview")
        .find((image) => image.getAttribute("src") === "blob:preview-1"),
    ).toBeInTheDocument();
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
  });

  it("ignores a main-image input change without a selected file", () => {
    renderDialog(createProduct());
    const mainImageInput = document.querySelector<HTMLInputElement>(
      'input[type="file"][accept="image/*"]',
    );
    expect(mainImageInput).not.toBeNull();

    fireEvent.change(mainImageInput!);

    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("ignores an additional-image input change without a selected file", () => {
    renderDialog(createProduct());
    const extraImageInput = document.querySelectorAll<HTMLInputElement>(
      'input[type="file"][accept="image/*"]',
    )[1];

    fireEvent.change(extraImageInput);

    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("removes existing additional images without revoking their URLs", () => {
    renderDialog(createProduct());
    const image = screen.getByAltText("Extra image preview");
    const removeButton = image.closest(".group")?.querySelector("button");

    fireEvent.click(removeButton!);

    expect(screen.getByText("No extra images yet.")).toBeVisible();
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it("ignores a repeated removal after an image has already been removed", () => {
    renderDialog(createProduct());
    const removeButton = screen
      .getByAltText("Extra image preview")
      .closest(".group")
      ?.querySelector("button");
    expect(removeButton).not.toBeNull();

    act(() => {
      fireEvent.click(removeButton!);
      fireEvent.click(removeButton!);
    });

    expect(screen.getByText("No extra images yet.")).toBeVisible();
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it("cancels editing and disables saving while the update is pending", async () => {
    const { onOpenChange } = renderDialog(createProduct());
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    cleanup();
    mutationState.isPending = true;
    renderDialog(createProduct());
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  });
});
