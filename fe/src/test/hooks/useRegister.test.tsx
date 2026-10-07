import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RegisterPayload } from "@/features/auth/service/auth.service";
import { authUsecase } from "@/features/auth/usecase/auth.usecase";
import useRegister from "@/hooks/useRegister";

vi.mock("@/features/auth/usecase/auth.usecase", () => ({
  authUsecase: {
    register: vi.fn(),
  },
}));

const registerPayload: RegisterPayload = {
  username: "new-user",
  password: "strong-password",
  fullName: "New User",
  phoneNumber: "0123456789",
  address: "Hanoi",
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

describe("useRegister", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits registration data and exposes the response", async () => {
    const response = { success: true, message: "Registered" };
    vi.mocked(authUsecase.register).mockResolvedValue(response);
    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.mutate(registerPayload));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(authUsecase.register).toHaveBeenCalledWith(registerPayload);
    expect(result.current.data).toEqual(response);
  });

  it("exposes registration errors", async () => {
    const error = new Error("Username already exists");
    vi.mocked(authUsecase.register).mockRejectedValue(error);
    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.mutate(registerPayload));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
  });
});
