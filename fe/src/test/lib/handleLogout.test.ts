import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleLogout } from "@/lib/handleLogout"; // Thay đổi đường dẫn cho đúng
import { authApi } from "@/api/axios.instance";
import { store } from "@/state/store";
import { beginLogout } from "@/lib/authLifecycle";
import { deleteInfo } from "@/state/profile/profileSlice";
import { deleteToken } from "@/state/token/tokenSlice";

vi.mock("@/api/axios.instance", () => ({
  authApi: {
    post: vi.fn(),
  },
}));

vi.mock("@/state/store", () => ({
  store: {
    dispatch: vi.fn(),
  },
}));

vi.mock("@/lib/authLifecycle", () => ({
  beginLogout: vi.fn(),
}));

vi.mock("@/state/profile/profileSlice", () => ({
  deleteInfo: vi.fn(() => ({ type: "profile/deleteInfo" })),
}));

vi.mock("@/state/token/tokenSlice", () => ({
  deleteToken: vi.fn(() => ({ type: "token/deleteToken" })),
}));

describe("handleLogout", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, "location", {
      value: { href: "http://localhost/" },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("should logout and navigate to /login", async () => {
    vi.mocked(authApi.post).mockResolvedValueOnce({ data: "ok" });

    await handleLogout();

    expect(beginLogout).toHaveBeenCalledOnce();

    expect(deleteInfo).toHaveBeenCalledOnce();
    expect(deleteToken).toHaveBeenCalledOnce();

    expect(authApi.post).toHaveBeenCalledWith(
      "/api/auth/logout",
      {},
      { withCredentials: true },
    );

    expect(window.location.href).toBe("/login");
  });

  it("should navigate if logout api error", async () => {
    const error = new Error("Network Error");
    vi.mocked(authApi.post).mockRejectedValueOnce(error);

    await expect(handleLogout()).rejects.toThrow("Network Error");

    expect(beginLogout).toHaveBeenCalledOnce();
    expect(store.dispatch).toHaveBeenCalledTimes(2);

    expect(window.location.href).toBe("/login");
  });
});
