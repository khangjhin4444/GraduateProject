import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import Page from "@/pages/auth/register";
import { MemoryRouter } from "react-router";

const mockNavigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockMutateAsync = vi.fn();
vi.mock("@/hooks/useRegister", () => ({
  default: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));

describe("Register Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  const renderPage = () => {
    return render(
      <MemoryRouter>
        <Page />
      </MemoryRouter>,
    );
  };

  it("renders all form fields and static elements correctly", () => {
    renderPage();

    expect(screen.getByText("Create account")).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Full Name \(Optional\)/i),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/Phone Number \(Optional\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Register" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Login Here!/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("shows Zod validation errors for invalid or empty inputs", async () => {
    const user = userEvent.setup();
    renderPage();

    // Submit form rỗng
    await user.click(screen.getByRole("button", { name: "Register" }));

    // Kiểm tra các lỗi bắt buộc từ Zod
    expect(
      await screen.findByText("Username must contains at least 5 characters"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Password must contains at least 8 characters"),
    ).toBeInTheDocument();

    // Nhập password không có chữ hoa/số
    const passwordInput = screen.getByLabelText(/^Password$/i);
    await user.type(passwordInput, "lowercaseonly");
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(
      await screen.findByText(
        "Password must contains at least 1 Uppercase and 1 number",
      ),
    ).toBeInTheDocument();

    // Nhập số điện thoại sai định dạng
    const phoneInput = screen.getByLabelText(/Phone Number \(Optional\)/i);
    await user.type(phoneInput, "123");
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(
      await screen.findByText("Phone number must contains 10 numbers"),
    ).toBeInTheDocument();

    // API mutate không được gọi
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("shows manual validation error when passwords do not match", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/Your Username/i), "validUser");
    await user.type(screen.getByLabelText(/^Password$/i), "ValidPass123");
    await user.type(
      screen.getByLabelText(/Confirm Password/i),
      "DifferentPass123",
    );

    await user.click(screen.getByRole("button", { name: "Register" }));

    // Lỗi set thủ công trong hàm onSubmit
    expect(
      await screen.findByText("Passwords do not match"),
    ).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("toggles visibility for both password and confirm password fields", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    // Tìm tất cả các icon con mắt (eye icon)
    const eyeIcons = container.querySelectorAll(".lucide-eye");
    expect(eyeIcons).toHaveLength(2);

    // Toggle trường Password
    await user.click(eyeIcons[0].parentElement!);
    expect(passwordInput).toHaveAttribute("type", "text");

    // Toggle trường Confirm Password
    await user.click(eyeIcons[1].parentElement!);
    expect(confirmPasswordInput).toHaveAttribute("type", "text");

    // Tìm icon nhắm mắt (eye-off icon) và toggle lại
    const eyeOffIcons = container.querySelectorAll(".lucide-eye-off");
    await user.click(eyeOffIcons[0].parentElement!);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("clears specific field errors on change", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Register" }));

    const usernameError = await screen.findByText(
      "Username must contains at least 5 characters",
    );
    expect(usernameError).toBeInTheDocument();

    // Nhập liệu vào trường đang lỗi
    await user.type(screen.getByLabelText(/Your Username/i), "newUser");

    // Lỗi phải biến mất do logic field.onChange kết hợp clearErrors
    await waitFor(() => {
      expect(
        screen.queryByText("Username must contains at least 5 characters"),
      ).not.toBeInTheDocument();
    });
  });

  it("submits the form successfully and navigates to login", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValueOnce({});

    renderPage();

    // Điền form hợp lệ
    await user.type(screen.getByLabelText(/Your Username/i), "KhangNguyen");
    await user.type(screen.getByLabelText(/^Password$/i), "StrongPass123");
    await user.type(
      screen.getByLabelText(/Confirm Password/i),
      "StrongPass123",
    );
    await user.type(screen.getByLabelText(/Full Name/i), "Nguyen Le Duy Khang");

    await user.type(screen.getByLabelText(/Phone Number/i), "0987654321");

    await user.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        username: "KhangNguyen",
        password: "StrongPass123",
        confirmPassword: "StrongPass123",
        fullName: "Nguyen Le Duy Khang",
        phoneNumber: "0987654321",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("handles known Axios errors from the API", async () => {
    const user = userEvent.setup();
    const axiosError = {
      isAxiosError: true,
      response: {
        data: { message: "Username already taken" },
      },
    };
    mockMutateAsync.mockRejectedValue(axiosError);

    renderPage();

    await user.type(screen.getByLabelText(/Your Username/i), "KhangNguyen");
    await user.type(screen.getByLabelText(/^Password$/i), "StrongPass123");
    await user.type(
      screen.getByLabelText(/Confirm Password/i),
      "StrongPass123",
    );

    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(
      await screen.findByText("Username already taken"),
    ).toBeInTheDocument();
  });

  it("handles standard Error instances from the API", async () => {
    const user = userEvent.setup();
    const standardError = new Error("Network connection lost");
    mockMutateAsync.mockRejectedValue(standardError);

    renderPage();

    await user.type(screen.getByLabelText(/Your Username/i), "KhangNguyen");
    await user.type(screen.getByLabelText(/^Password$/i), "StrongPass123");
    await user.type(
      screen.getByLabelText(/Confirm Password/i),
      "StrongPass123",
    );

    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(
      await screen.findByText("Network connection lost"),
    ).toBeInTheDocument();
  });

  it("handles unknown errors with fallback message", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue("Some weird string error");

    renderPage();

    await user.type(screen.getByLabelText(/Your Username/i), "KhangNguyen");
    await user.type(screen.getByLabelText(/^Password$/i), "StrongPass123");
    await user.type(
      screen.getByLabelText(/Confirm Password/i),
      "StrongPass123",
    );

    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByText("Registration failed")).toBeInTheDocument();
  });
});
