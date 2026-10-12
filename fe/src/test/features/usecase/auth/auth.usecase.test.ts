import { describe, it, expect, vi, afterEach } from "vitest";
import { authUsecase } from "@/features/auth/usecase/auth.usecase"; // Adjust path if necessary
import { authService } from "@/features/auth/service/auth.service";

vi.mock("@/features/auth/service/auth.service", () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
  },
}));

describe("AuthUsecase", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should call authService.login with payload and return the result", async () => {
      const mockPayload = { username: "testuser", password: "A12345678" };
      const mockResponse = { success: true, message: "login respond" };
      vi.mocked(authService.login).mockResolvedValue(mockResponse as never);

      const result = await authUsecase.login(mockPayload);

      expect(authService.login).toHaveBeenCalledWith(mockPayload);
      expect(authService.login).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("register", () => {
    it("should call authService.register with payload", async () => {
      const mockPayload = { username: "testuser", password: "A12345678" };
      const mockResponse = { success: true, message: "registered" };
      vi.mocked(authService.register).mockResolvedValue(mockResponse as never);

      const result = await authUsecase.register(mockPayload);

      expect(authService.register).toHaveBeenCalledWith(mockPayload);
      expect(authService.register).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });
});
