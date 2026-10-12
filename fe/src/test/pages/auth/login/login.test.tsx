import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import Page from "@/pages/auth/login/index";
import { MemoryRouter } from "react-router";
import * as authLifecycle from "@/lib/authLifecycle";

const mockNavigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockDispatch = vi.fn();
vi.mock("@/state/hooks", () => ({
  useAppDispatch: () => mockDispatch,
}));

const mockMutateAsync = vi.fn();
vi.mock("@/hooks/useLogin", () => ({
  default: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));

vi.mock("@/state/token/tokenSlice", () => ({
  setToken: vi.fn((token) => ({ type: "SET_TOKEN", payload: token })),
}));

vi.mock("@/state/profile/profileSlice", () => ({
  setInfo: vi.fn((info) => ({ type: "SET_INFO", payload: info })),
}));

vi.mock("@/lib/authLifecycle", () => ({
  completeLogin: vi.fn(),
}));

describe("Login Page", () => {
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

  it("renders the login form correctly", () => {
    renderPage();

    expect(screen.getByText("Login Account")).toBeInTheDocument();

    expect(screen.getByLabelText(/Your Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Register Here!/i }),
    ).toHaveAttribute("href", "/register");
  });

  it("shows validation errors when submitting empty fields", async () => {
    const user = userEvent.setup();
    renderPage();

    const submitBtn = screen.getByRole("button", { name: "Login" });
    await user.click(submitBtn);

    // Zod validation messages
    expect(
      await screen.findByText("Please Enter Username"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Please Enter Password"),
    ).toBeInTheDocument();

    // API mutate should not be called
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("toggles password visibility when clicking the eye icon", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    const passwordInput = screen.getByLabelText(/Password/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    // The icon doesn't have an aria-label in the component, so we find it via the addon container
    const toggleIcon = container.querySelector(".lucide-eye")?.parentElement;
    if (toggleIcon) {
      await user.click(toggleIcon);
      expect(passwordInput).toHaveAttribute("type", "text");

      const toggleOffIcon =
        container.querySelector(".lucide-eye-off")?.parentElement;
      await user.click(toggleOffIcon!);
      expect(passwordInput).toHaveAttribute("type", "password");
    }
  });

  it("clears password validation error when typing", async () => {
    const user = userEvent.setup();
    renderPage();

    const submitBtn = screen.getByRole("button", { name: "Login" });
    await user.click(submitBtn);

    // Error appears
    const errorMsg = await screen.findByText("Please Enter Password");
    expect(errorMsg).toBeInTheDocument();

    // Typing in the password field should trigger form.clearErrors() via onChange
    const passwordInput = screen.getByLabelText(/Password/i);
    await user.type(passwordInput, "secret123");

    await waitFor(() => {
      expect(
        screen.queryByText("Please Enter Password"),
      ).not.toBeInTheDocument();
    });
  });

  it("submits the form successfully and navigates to admin dashboard for admin users", async () => {
    const user = userEvent.setup();
    const mockResponse = {
      accessToken: "mock-token",
      user: {
        id: "1",
        Name: "Admin User",
        Phone: "0123456789",
        Address: "Ha Noi",
        role: "admin",
      },
    };
    mockMutateAsync.mockResolvedValue(mockResponse);

    renderPage();

    await user.type(screen.getByLabelText(/Your Username/i), "admin_jk");
    await user.type(screen.getByLabelText(/Password/i), "password123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        username: "admin_jk",
        password: "password123",
      });
      expect(authLifecycle.completeLogin).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledTimes(2); // setToken and setInfo
      expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard");
    });
  });

  it("submits the form successfully and navigates to home for customer users", async () => {
    const user = userEvent.setup();
    const mockResponse = {
      accessToken: "customer-token",
      user: {
        id: "2",
        Name: "",
        Phone: "",
        Address: "",
        role: "user",
      },
    };
    mockMutateAsync.mockResolvedValue(mockResponse);

    renderPage();

    await user.type(screen.getByLabelText(/Your Username/i), "customer_1");
    await user.type(screen.getByLabelText(/Password/i), "pass123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/home");
    });
  });

  it("handles known Axios errors (e.g., wrong credentials) gracefully", async () => {
    const user = userEvent.setup();
    // Simulate Axios Error structure
    const axiosError = {
      isAxiosError: true,
      response: {
        data: { message: "Invalid username or password" },
      },
    };
    mockMutateAsync.mockRejectedValue(axiosError);

    renderPage();

    await user.type(screen.getByLabelText(/Your Username/i), "wrong_user");
    await user.type(screen.getByLabelText(/Password/i), "wrong_pass");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Invalid username or password"),
    ).toBeInTheDocument();
  });

  it("handles generic server errors when response data is missing", async () => {
    const user = userEvent.setup();
    const genericError = new Error("Network Error");
    mockMutateAsync.mockRejectedValue(genericError);

    renderPage();

    await user.type(screen.getByLabelText(/Your Username/i), "user");
    await user.type(screen.getByLabelText(/Password/i), "pass");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Server Error")).toBeInTheDocument();
  });
});
