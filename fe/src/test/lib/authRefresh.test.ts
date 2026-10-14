import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LoginSchema,
  type LoginResponseEntity,
} from "@/features/auth/schema/auth.schema";
import { store } from "@/state/store";
import { deleteInfo } from "@/state/profile/profileSlice";
import { deleteToken, setToken } from "@/state/token/tokenSlice";
import { beginLogout, completeLogin } from "@/lib/authLifecycle";

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock("@/api/axios.instance", () => ({
  authApi: { request: mocks.request },
}));

import { refreshAuth } from "@/lib/authRefresh";

const loginResponse: LoginResponseEntity = {
  success: true,
  accessToken: "refreshed-token",
  user: {
    id: 12,
    cartQuantity: "2",
    Name: "Keyboard User",
    Phone: "123456789",
    provinceName: "Thành phố Hồ Chí Minh",
    street: "123 Lý Thường Kiệt",
    wardName: "Phường Hòa Bình",
    role: "admin",
  },
};

function errorWithStatus(status: number) {
  return Object.assign(new Error(`HTTP ${status}`), {
    response: { status },
  });
}

describe("refreshAuth", () => {
  let consoleLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    store.dispatch(deleteToken());
    store.dispatch(deleteInfo());
    completeLogin();
    consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    consoleLog.mockRestore();
  });

  it("requests a refresh and stores the returned token and profile", async () => {
    mocks.request.mockResolvedValueOnce({ data: loginResponse });

    await expect(refreshAuth()).resolves.toEqual({
      success: true,
      expiredSession: false,
      shouldLogin: false,
    });

    expect(mocks.request).toHaveBeenCalledExactlyOnceWith({
      method: "POST",
      url: "/auth/refresh",
      withCredentials: true,
      responseSchema: LoginSchema,
    });
    expect(store.getState().token).toEqual({
      accessToken: "refreshed-token",
      authChecked: true,
    });
    expect(store.getState().profile).toEqual({
      id: 12,
      fullName: "Keyboard User",
      phoneNumber: "123456789",
      provinceName: "Thành phố Hồ Chí Minh",
      street: "123 Lý Thường Kiệt",
      wardName: "Phường Hòa Bình",
      role: "admin",
    });
  });

  it("uses empty strings when optional profile fields are null", async () => {
    mocks.request.mockResolvedValueOnce({
      data: {
        ...loginResponse,
        user: {
          ...loginResponse.user,
          Name: null,
          Phone: null,
          provinceCode: null,
          provinceName: null,
          street: null,
          wardCode: null,
          wardName: null,
        },
      },
    });

    await refreshAuth();

    expect(store.getState().profile).toEqual({
      id: 12,
      fullName: "",
      phoneNumber: "",
      provinceName: "",
      street: "",
      wardName: "",
      role: "admin",
    });
  });

  it("shares one in-flight refresh promise across concurrent callers", async () => {
    let resolveRequest!: (value: { data: LoginResponseEntity }) => void;
    mocks.request.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const firstRefresh = refreshAuth();
    const secondRefresh = refreshAuth();
    expect(secondRefresh).toBe(firstRefresh);
    expect(mocks.request).toHaveBeenCalledOnce();

    resolveRequest({ data: loginResponse });

    await expect(firstRefresh).resolves.toEqual({
      success: true,
      expiredSession: false,
      shouldLogin: false,
    });
  });

  it("does not restore credentials when an in-flight refresh resolves after logout", async () => {
    let resolveRequest!: (value: { data: LoginResponseEntity }) => void;
    mocks.request.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const refreshResult = refreshAuth();
    beginLogout();
    store.dispatch(deleteToken());
    store.dispatch(deleteInfo());
    resolveRequest({ data: loginResponse });

    await expect(refreshResult).resolves.toEqual({
      success: false,
      expiredSession: false,
      shouldLogin: true,
    });
    expect(store.getState().token.accessToken).toBe("");
    expect(store.getState().profile.id).toBe(0);
  });

  it("does not start a refresh while logout is in progress", async () => {
    beginLogout();

    await expect(refreshAuth()).resolves.toEqual({
      success: false,
      expiredSession: false,
      shouldLogin: true,
    });

    expect(mocks.request).not.toHaveBeenCalled();
  });

  it("does not let an old refresh overwrite a successful login", async () => {
    let resolveRequest!: (value: { data: LoginResponseEntity }) => void;
    mocks.request.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const refreshResult = refreshAuth();
    beginLogout();
    completeLogin();
    store.dispatch(setToken("new-login-token"));
    resolveRequest({ data: loginResponse });

    await expect(refreshResult).resolves.toEqual({
      success: false,
      expiredSession: false,
      shouldLogin: false,
    });
    expect(store.getState().token.accessToken).toBe("new-login-token");
  });

  it("keeps a newer in-flight refresh when an older operation settles", async () => {
    let resolveFirstRequest!: (value: { data: LoginResponseEntity }) => void;
    let resolveSecondRequest!: (value: { data: LoginResponseEntity }) => void;
    mocks.request
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirstRequest = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecondRequest = resolve;
          }),
      );

    const firstRefresh = refreshAuth();

    beginLogout();
    completeLogin();
    store.dispatch(setToken("new-login-token"));
    const secondRefresh = refreshAuth();

    expect(secondRefresh).not.toBe(firstRefresh);
    expect(mocks.request).toHaveBeenCalledTimes(2);

    resolveFirstRequest({ data: loginResponse });
    await expect(firstRefresh).resolves.toEqual({
      success: false,
      expiredSession: false,
      shouldLogin: false,
    });
    expect(store.getState().token.accessToken).toBe("new-login-token");

    const repeatedRefresh = refreshAuth();
    expect(repeatedRefresh).toBe(secondRefresh);
    expect(mocks.request).toHaveBeenCalledTimes(2);

    resolveSecondRequest({ data: loginResponse });
    await expect(secondRefresh).resolves.toEqual({
      success: true,
      expiredSession: false,
      shouldLogin: false,
    });
    expect(store.getState().token.accessToken).toBe("refreshed-token");
  });

  it("retries a refresh request after a 409 response", async () => {
    vi.useFakeTimers();
    mocks.request
      .mockRejectedValueOnce(errorWithStatus(409))
      .mockResolvedValueOnce({ data: loginResponse });

    const resultPromise = refreshAuth();
    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toEqual({
      success: true,
      expiredSession: false,
      shouldLogin: false,
    });
    expect(mocks.request).toHaveBeenCalledTimes(2);
  });

  it("does not retry a refresh after logout starts during the 409 backoff", async () => {
    vi.useFakeTimers();
    mocks.request.mockRejectedValueOnce(errorWithStatus(409));

    const resultPromise = refreshAuth();
    await vi.waitFor(() => expect(mocks.request).toHaveBeenCalledOnce());
    beginLogout();
    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toEqual({
      success: false,
      expiredSession: false,
      shouldLogin: true,
    });
    expect(mocks.request).toHaveBeenCalledOnce();
  });

  it("stops retrying after the maximum number of 409 responses", async () => {
    vi.useFakeTimers();
    mocks.request.mockRejectedValue(errorWithStatus(409));

    const resultPromise = refreshAuth();
    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toEqual({
      success: false,
      expiredSession: false,
      shouldLogin: false,
    });
    expect(mocks.request).toHaveBeenCalledTimes(6);
    expect(consoleLog).toHaveBeenCalledOnce();
  });

  it("clears token and profile after a 401 response", async () => {
    store.dispatch(setToken("old-token"));
    mocks.request.mockRejectedValueOnce(errorWithStatus(401));

    await expect(refreshAuth()).resolves.toEqual({
      success: false,
      expiredSession: false,
      shouldLogin: true,
    });

    expect(store.getState().token.accessToken).toBe("");
    expect(store.getState().profile).toEqual({
      id: 0,
      fullName: "",
      phoneNumber: "",
      provinceName: "",
      street: "",
      wardName: "",
      role: "user",
    });
  });

  it("clears credentials and requests login after a 403 response", async () => {
    store.dispatch(setToken("old-token"));
    mocks.request.mockRejectedValueOnce(errorWithStatus(403));

    await expect(refreshAuth()).resolves.toEqual({
      success: false,
      expiredSession: true,
      shouldLogin: true,
    });

    expect(store.getState().token.accessToken).toBe("");
  });

  it.each([
    ["503", errorWithStatus(503)],
    ["network", new Error("Network error")],
    ["non-object", "unexpected failure"],
  ])("keeps current credentials on a %s error", async (_, error) => {
    store.dispatch(setToken("old-token"));
    mocks.request.mockRejectedValueOnce(error);

    await expect(refreshAuth()).resolves.toEqual({
      success: false,
      expiredSession: false,
      shouldLogin: false,
    });

    expect(store.getState().token.accessToken).toBe("old-token");
  });

  it("Keeps credentials for other HTTP errors without requesting login", async () => {
    store.dispatch(setToken("old-token"));
    mocks.request.mockRejectedValueOnce(errorWithStatus(500));

    await expect(refreshAuth()).resolves.toEqual({
      success: false,
      expiredSession: false,
      shouldLogin: false,
    });

    expect(store.getState().token.accessToken).toBe("old-token");
  });
});
