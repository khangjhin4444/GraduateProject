import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LoginPayload } from "@/features/auth/service/auth.service";
import { authUsecase } from "@/features/auth/usecase/auth.usecase";
import useLogin from "@/hooks/useLogin";

vi.mock("@/features/auth/usecase/auth.usecase", () => ({
  authUsecase: {
    login: vi.fn(),
  },
}));

const loginPayload: LoginPayload = {
  username: "keyboard-user",
  password: "strong-password",
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

describe("useLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits the login payload and exposes the response", async () => {
    const response = {
      success: true,
      accessToken: "access-token",
      user: {
        id: 12,
        cartQuantity: "2",
        Name: "Keyboard User",
        Phone: null,
        Address: null,
        role: "user" as const,
      },
    };
    vi.mocked(authUsecase.login).mockResolvedValue(response);
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.mutate(loginPayload));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(authUsecase.login).toHaveBeenCalledWith(loginPayload);
    expect(result.current.data).toEqual(response);
  });

  it("exposes login errors", async () => {
    const error = new Error("Invalid credentials");
    vi.mocked(authUsecase.login).mockRejectedValue(error);
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.mutate(loginPayload));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
  });
});
