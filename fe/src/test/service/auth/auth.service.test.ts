import { afterEach, describe, expect, it, vi } from "vitest";
import { publicApi } from "@/api/axios.instance";
import { authService } from "@/features/auth/service/auth.service";

describe("authService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers with the expected payload and response schema", async () => {
    const data = { success: true, message: "Registered" };
    const request = vi.spyOn(publicApi, "request").mockResolvedValue({ data });

    await expect(
      authService.register({
        username: "user",
        password: "password",
        fullName: "Keyboard User",
        phoneNumber: "123456789",
        address: "Keyboard Street",
      }),
    ).resolves.toEqual(data);

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: "/api/auth/register",
        data: {
          username: "user",
          password: "password",
          fullName: "Keyboard User",
          phone: "123456789",
          address: "Keyboard Street",
        },
      }),
    );
  });

  it("maps optional registration fields when omitted", async () => {
    const request = vi.spyOn(publicApi, "request").mockResolvedValue({
      data: { success: true, message: "Registered" },
    });

    await authService.register({ username: "user", password: "password" });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          username: "user",
          password: "password",
          fullName: undefined,
          phone: undefined,
          address: undefined,
        },
      }),
    );
  });

  it("logs in with credentials, response validation, and cookies enabled", async () => {
    const data = {
      success: true,
      accessToken: "token",
      user: {
        id: 1,
        cartQuantity: "0",
        Name: "Keyboard User",
        Phone: null,
        Address: null,
        role: "user",
      },
    };
    const request = vi.spyOn(publicApi, "request").mockResolvedValue({ data });

    await expect(
      authService.login({ username: "user", password: "password" }),
    ).resolves.toEqual(data);

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: "/api/auth/login",
        data: { username: "user", password: "password" },
        withCredentials: true,
      }),
    );
  });
});
