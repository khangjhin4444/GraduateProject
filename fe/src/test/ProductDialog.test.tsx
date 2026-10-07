import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { ProductFormDialog } from "@/pages/admin/products/_components/ProductFormDialog";

const nativeURL = URL;

const { mutate, editorSave, mutationState } = vi.hoisted(() => ({
  mutate: vi.fn(),
  editorSave: vi.fn(),
  mutationState: { isPending: false },
}));

vi.mock("@/hooks/useSaveProduct", () => ({
  useSaveProduct: () => ({
    isPending: mutationState.isPending,
    mutate,
  }),
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

vi.mock("@/pages/admin/products/_components/ImageUploader", () => ({
  ImageUploader: ({
    onFileChange,
  }: {
    onFileChange: (file: File) => void;
  }) => (
    <input
      type="file"
      accept="image/*"
      aria-label="Variant image upload"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) onFileChange(file);
      }}
    />
  ),
}));

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );

  vi.stubGlobal(
    "PointerEvent",
    class extends Event {
      constructor(type: string, props: PointerEventInit) {
        super(type, props);
      }
    },
  );

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

function renderComponent(initType = "KeyboardKit") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const onOpenChange = vi.fn();
  const onSaved = vi.fn();
  const view = render(
    <QueryClientProvider client={queryClient}>
      <ProductFormDialog
        initType={initType}
        open
        onOpenChange={onOpenChange}
        onSaved={onSaved}
      />
    </QueryClientProvider>,
  );

  return { ...view, onOpenChange, onSaved };
}

function setInputFile(input: HTMLInputElement, file: File) {
  Object.defineProperty(input, "files", {
    configurable: true,
    value: [file],
  });
  fireEvent.change(input);
}

describe("ProductFormDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutationState.isPending = false;
    let previewIndex = 0;
    vi.stubGlobal("URL", {
      ...nativeURL,
      createObjectURL: vi.fn(() => `blob:extra-${++previewIndex}`),
    });
    editorSave.mockResolvedValue({
      time: 1,
      blocks: [{ type: "paragraph", data: { text: "Product description" } }],
      version: "2.31.7",
    });
  });

  afterEach(() => {
    cleanup();
    vi.stubGlobal("URL", nativeURL);
  });

  it("renders the initial product form and subtype for the selected type", () => {
    renderComponent("Switch");

    expect(screen.getByRole("heading", { name: "New product" })).toBeVisible();
    expect(screen.getByPlaceholderText("Product name")).toHaveValue("");
    expect(screen.getByTestId("mock-editor")).toBeVisible();

    const selects = screen.getAllByRole("combobox");
    expect(selects[0]).toHaveTextContent("Switch");
    expect(selects[1]).toHaveTextContent("Linear");
    expect(screen.getByText("No extra images yet.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it.each([
    {
      type: "KeyboardKit",
      label: "Keyboard Kit",
      subtype: "Alice",
      options: ["Alice", "75%", "TKL", "Full Size"],
    },
    {
      type: "Prebuild",
      label: "Prebuild",
      subtype: "Alice",
      options: ["Alice", "75%", "TKL", "Full Size"],
    },
    {
      type: "Switch",
      label: "Switch",
      subtype: "Linear",
      options: ["Linear", "Tactile", "Clicky", "Silent"],
    },
    {
      type: "Keycap",
      label: "Keycap",
      subtype: "Cherry",
      options: ["Cherry", "MDA", "SA", "Artisan"],
    },
  ])(
    "updates subtype options when product type changes to $type",
    async ({ type, label, subtype, options }) => {
      const user = userEvent.setup();
      renderComponent();
      const [typeSelect, subtypeSelect] = screen.getAllByRole("combobox");

      expect(typeSelect).toHaveTextContent("KeyboardKit");
      expect(subtypeSelect).toHaveTextContent("Alice");
      await user.click(typeSelect);
      await user.click(await screen.findByRole("option", { name: label }));

      expect(typeSelect).toHaveTextContent(type);
      await waitFor(() => expect(subtypeSelect).toHaveTextContent(subtype));
      await user.click(subtypeSelect);
      for (const option of options) {
        expect(
          await screen.findByRole("option", { name: option }),
        ).toBeInTheDocument();
      }
      await user.click(await screen.findByRole("option", { name: options[1] }));
      expect(subtypeSelect).toHaveTextContent(options[1]);
    },
  );

  it("adds variants and prevents removing the last remaining variant", async () => {
    const user = userEvent.setup();
    renderComponent();

    const removeButtons = screen.getAllByRole("button", { name: "" });
    const initialRemoveButton = removeButtons.find((button) =>
      button.querySelector("svg.lucide-trash-2"),
    );
    expect(initialRemoveButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /Add variant/i }));
    expect(screen.getAllByPlaceholderText("Black")).toHaveLength(2);
    expect(
      screen
        .getAllByRole("button", { name: "" })
        .filter((button) => button.querySelector("svg.lucide-trash-2")),
    ).toHaveLength(2);

    const variantRemoveButtons = screen
      .getAllByRole("button", { name: "" })
      .filter((button) => button.querySelector("svg.lucide-trash-2"));
    await user.click(variantRemoveButtons[1]);
    expect(screen.getAllByPlaceholderText("Black")).toHaveLength(1);
    expect(
      screen
        .getAllByRole("button", { name: "" })
        .find((button) => button.querySelector("svg.lucide-trash-2")),
    ).toBeDisabled();
  });

  it("adds and removes extra images", () => {
    renderComponent();
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const extraImageInput = fileInputs.item(fileInputs.length - 1);
    const file = new File(["extra"], "extra.jpg", { type: "image/jpeg" });

    setInputFile(extraImageInput as HTMLInputElement, file);

    expect(screen.queryByText("No extra images yet.")).not.toBeInTheDocument();
    expect(screen.getByAltText("Extra image preview")).toBeVisible();

    const imageContainer = screen.getByAltText("Extra image preview").closest(".group");
    const removeButton = imageContainer?.querySelector("button");
    expect(removeButton).not.toBeNull();
    fireEvent.click(removeButton!);
    expect(screen.getByText("No extra images yet.")).toBeVisible();
  });

  it("ignores an extra-image change without a selected file", () => {
    renderComponent();
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const extraImageInput = fileInputs.item(fileInputs.length - 1);

    fireEvent.change(extraImageInput);

    expect(screen.getByText("No extra images yet.")).toBeVisible();
    expect(screen.queryByAltText("Extra image preview")).not.toBeInTheDocument();
  });

  it("shows required-field validation and does not submit an invalid form", async () => {
    editorSave.mockResolvedValue({ blocks: [] });
    renderComponent();

    fireEvent.submit(screen.getByRole("button", { name: "Save" }).closest("form")!);

    expect(await screen.findByText("Color is required")).toBeVisible();
    expect(await screen.findByText("Price must be at least 1")).toBeVisible();
    expect(await screen.findByText("Stock must be at least 1")).toBeVisible();
    expect(await screen.findByText("Image is required")).toBeVisible();
    expect(
      await screen.findByText("Please enter a product description"),
    ).toBeVisible();
    expect(editorSave).toHaveBeenCalledOnce();
    expect(
      screen.getByPlaceholderText("Product name"),
    ).toHaveAttribute("aria-invalid", "true");
    expect(mutate).not.toHaveBeenCalled();
  });

  it("shows the object-level description validation message", async () => {
    editorSave.mockResolvedValueOnce("not editor data");
    renderComponent();

    fireEvent.submit(
      screen.getByRole("button", { name: "Save" }).closest("form")!,
    );

    expect(
      await screen.findByText(/expected object, received string/i),
    ).toBeVisible();
  });

  it("uses the fallback description message when validation has no message", async () => {
    editorSave.mockResolvedValueOnce({ blocks: [null] });
    renderComponent();

    fireEvent.submit(
      screen.getByRole("button", { name: "Save" }).closest("form")!,
    );

    expect(
      await screen.findByText("Please enter a product description"),
    ).toBeVisible();
  });

  it("clears the description error when other fields are invalid but description is valid", async () => {
    editorSave.mockResolvedValueOnce({ blocks: [] });
    renderComponent();

    fireEvent.submit(
      screen.getByRole("button", { name: "Save" }).closest("form")!,
    );
    expect(
      await screen.findByText("Please enter a product description"),
    ).toBeVisible();

    editorSave.mockResolvedValueOnce({
      blocks: [{ type: "paragraph", data: { text: "Valid description" } }],
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Save" }).closest("form")!,
    );

    await waitFor(() => {
      expect(
        screen.queryByText("Please enter a product description"),
      ).not.toBeInTheDocument();
    });
    expect(mutate).not.toHaveBeenCalled();
  });

  it("shows editor save errors and does not submit the form", async () => {
    editorSave.mockRejectedValueOnce(new Error("Editor could not save"));
    renderComponent();

    fireEvent.submit(
      screen.getByRole("button", { name: "Save" }).closest("form")!,
    );

    expect(await screen.findByText("Editor could not save")).toBeVisible();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("shows a fallback message when the editor rejects with a non-Error value", async () => {
    editorSave.mockRejectedValueOnce("editor unavailable");
    renderComponent();

    fireEvent.submit(
      screen.getByRole("button", { name: "Save" }).closest("form")!,
    );

    expect(
      await screen.findByText("Unable to save the product description"),
    ).toBeVisible();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("does not replace the description when the editor returns no data", async () => {
    editorSave.mockResolvedValueOnce(undefined);
    renderComponent();

    fireEvent.submit(
      screen.getByRole("button", { name: "Save" }).closest("form")!,
    );

    expect(
      await screen.findByText("Please enter a product description"),
    ).toBeVisible();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("closes the form when cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderComponent();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("saves editor data before submitting valid form data", async () => {
    const user = userEvent.setup();
    renderComponent("Switch");

    await user.type(screen.getByPlaceholderText("Product name"), "New Switch");
    await user.type(screen.getByPlaceholderText("Black"), "Black");
    const numberInputs = screen.getAllByPlaceholderText("0");
    fireEvent.change(numberInputs[0], { target: { value: "1" } });
    fireEvent.change(numberInputs[1], { target: { value: "1" } });
    fireEvent.change(numberInputs[0], { target: { value: "" } });
    fireEvent.change(numberInputs[1], { target: { value: "" } });
    fireEvent.change(numberInputs[0], { target: { value: "25" } });
    fireEvent.change(numberInputs[1], { target: { value: "10" } });

    const variantImage = new File(["variant"], "switch.jpg", {
      type: "image/jpeg",
    });
    setInputFile(
      screen.getByLabelText("Variant image upload") as HTMLInputElement,
      variantImage,
    );

    fireEvent.submit(screen.getByRole("button", { name: "Save" }).closest("form")!);

    await waitFor(() => expect(mutate).toHaveBeenCalledOnce());
    expect(editorSave).toHaveBeenCalledOnce();
    const submittedForm = mutate.mock.calls[0][0];
    expect(submittedForm).toMatchObject({
      name: "New Switch",
      type: "Switch",
      subtype: "Linear",
      description: {
        blocks: [
          { type: "paragraph", data: { text: "Product description" } },
        ],
      },
      variants: [
        {
          color: "Black",
          price: 25,
          stock: 10,
          file: variantImage,
        },
      ],
    });
  });

  it("disables save and shows pending text while saving", () => {
    mutationState.isPending = true;
    renderComponent();

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  });
});
