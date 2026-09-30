import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProductFormDialog } from "@/pages/admin/products/_components/ProductFormDialog";

// 1. Mock các thư viện và component không cần thiết hoặc dễ gây lỗi trong JSDOM
vi.mock("@/pages/admin/products/_components/EditorJsInput", () => ({
  EditorJsInput: vi.fn(() => <div data-testid="mock-editor">Editor</div>),
}));

vi.mock("@/features/admin/usecase/admin.usecase", () => ({
  AdminUsecase: {
    addProduct: vi.fn(),
  },
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
      constructor(type: string, props: any) {
        super(type, props);
      }
    },
  );

  // 2. Khắc phục lỗi "window.matchMedia is not a function" từ EditorJS
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Dành cho các thư viện cũ
      removeListener: vi.fn(), // Dành cho các thư viện cũ
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // 3. Mock scrollIntoView cho Radix UI Select
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe("ProductFormDialo - Logic thay đổi Type và Subtype", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ProductFormDialog
          initType="KeyboardKit"
          open={true}
          onOpenChange={vi.fn()}
          onSaved={vi.fn()}
        />
      </QueryClientProvider>,
    );
  };

  it.each([
    {
      type: "KeyboardKit",
      expectedSub: "Alice",
      expectedSubSelect: ["Alice", "75%", "TKL", "Full Size"],
    },
    {
      type: "Prebuild",
      expectedSub: "Alice",
      expectedSubSelect: ["Alice", "75%", "TKL", "Full Size"],
    },
    {
      type: "Switch",
      expectedSub: "Linear",
      expectedSubSelect: ["Linear", "Tactile", "Clicky", "Silent"],
    },
    {
      type: "Keycap",
      expectedSub: "Cherry",
      expectedSubSelect: ["Cherry", "MDA", "SA", "Artisan"],
    },
  ])(
    "Should update SubType $expectedSub when ProductType change to $type",
    async ({ type, expectedSub, expectedSubSelect }) => {
      const user = userEvent.setup();
      renderComponent();

      // Tìm tất cả các thẻ select (combobox)
      // Radix UI Select gán role="combobox" cho nút trigger
      const comboboxes = await screen.findAllByRole("combobox");

      // Dựa vào cấu trúc code, select đầu tiên là Type, thứ hai là Subtype
      const typeSelect = comboboxes[0];
      const subtypeSelect = comboboxes[1];

      // 1. Kiểm tra giá trị khởi tạo (initType = 'KeyboardKit')
      expect(typeSelect).toHaveTextContent("KeyboardKit");
      expect(subtypeSelect).toHaveTextContent("Alice");

      // 2. Mở dropdown của Type
      await user.click(typeSelect);

      const option = await screen.findByRole("option", {
        name: type === "KeyboardKit" ? "Keyboard Kit" : type,
      });
      await user.click(option);

      // 3. Kiểm tra xem Type đã cập nhật thành Switch chưa
      expect(typeSelect).toHaveTextContent(type);

      // 4. Kiểm tra xem Subtype đã TỰ ĐỘNG chuyển thành giá trị đầu tiên của Switch ("Linear") chưa
      await waitFor(() => {
        expect(subtypeSelect).toHaveTextContent(expectedSub);
      });

      // 5. (Tùy chọn) Mở dropdown Subtype để xác nhận danh sách options đã thay đổi tương ứng với Switch
      await user.click(subtypeSelect);

      // Subtype của Switch bao gồm: ["Linear", "Tactile", "Clicky", "Silent"]
      expect(
        await screen.findByRole("option", { name: expectedSubSelect[0] }),
      ).toBeInTheDocument();
      expect(
        await screen.findByRole("option", { name: expectedSubSelect[1] }),
      ).toBeInTheDocument();
      expect(
        await screen.findByRole("option", { name: expectedSubSelect[2] }),
      ).toBeInTheDocument();
      expect(
        await screen.findByRole("option", { name: expectedSubSelect[3] }),
      ).toBeInTheDocument();
    },
  );
});
