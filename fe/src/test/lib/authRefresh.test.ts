import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LoginResponseEntity } from "@/features/auth/schema/auth.schema";
import { store } from "@/state/store";
import { deleteInfo } from "@/state/profile/profileSlice";
import { deleteToken, setToken } from "@/state/token/tokenSlice";
import { beginLogout, completeLogin } from "@/lib/authLifecycle";

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock("@/api/axios.instance", () => ({
  authApi: { post: mocks.post },
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
    Address: "Keyboard Street",
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
    mocks.post.mockResolvedValueOnce({ data: loginResponse });

    await expect(refreshAuth()).resolves.toEqual({
      success: true,
      expiredSession: false,
      shouldLogin: false,
    });

    expect(mocks.post).toHaveBeenCalledExactlyOnceWith(
      "/api/auth/refresh",
      {},
      { withCredentials: true },
    );
    expect(store.getState().token).toEqual({
      accessToken: "refreshed-token",
      authChecked: true,
    });
    expect(store.getState().profile).toEqual({
      id: 12,
      fullName: "Keyboard User",
      phoneNumber: "123456789",
      address: "Keyboard Street",
      role: "admin",
    });
  });

  it("uses empty strings when optional profile fields are null", async () => {
    mocks.post.mockResolvedValueOnce({
      data: {
        ...loginResponse,
        user: { ...loginResponse.user, Name: null, Phone: null, Address: null },
      },
    });

    await refreshAuth();

    expect(store.getState().profile).toEqual({
      id: 12,
      fullName: "",
      phoneNumber: "",
      address: "",
      role: "admin",
    });
  });

  it("shares one in-flight refresh promise across concurrent callers", async () => {
    let resolveRequest!: (value: { data: LoginResponseEntity }) => void;
    mocks.post.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const firstRefresh = refreshAuth();
    const secondRefresh = refreshAuth();
    expect(secondRefresh).toBe(firstRefresh);
    expect(mocks.post).toHaveBeenCalledOnce();

    resolveRequest({ data: loginResponse });

    await expect(firstRefresh).resolves.toEqual({
      success: true,
      expiredSession: false,
      shouldLogin: false,
    });
  });

  it("does not restore credentials when an in-flight refresh resolves after logout", async () => {
    let resolveRequest!: (value: { data: LoginResponseEntity }) => void;
    mocks.post.mockImplementation(
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

    expect(mocks.post).not.toHaveBeenCalled();
  });

  it("does not let an old refresh overwrite a successful login", async () => {
    let resolveRequest!: (value: { data: LoginResponseEntity }) => void;
    mocks.post.mockImplementation(
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
    mocks.post
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
    expect(mocks.post).toHaveBeenCalledTimes(2);

    resolveFirstRequest({ data: loginResponse });
    await expect(firstRefresh).resolves.toEqual({
      success: false,
      expiredSession: false,
      shouldLogin: false,
    });
    expect(store.getState().token.accessToken).toBe("new-login-token");

    const repeatedRefresh = refreshAuth();
    expect(repeatedRefresh).toBe(secondRefresh);
    expect(mocks.post).toHaveBeenCalledTimes(2);

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
    mocks.post
      .mockRejectedValueOnce(errorWithStatus(409))
      .mockResolvedValueOnce({ data: loginResponse });

    const resultPromise = refreshAuth();
    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toEqual({
      success: true,
      expiredSession: false,
      shouldLogin: false,
    });
    expect(mocks.post).toHaveBeenCalledTimes(2);
  });

  it("does not retry a refresh after logout starts during the 409 backoff", async () => {
    vi.useFakeTimers();
    mocks.post.mockRejectedValueOnce(errorWithStatus(409));

    const resultPromise = refreshAuth();
    await vi.waitFor(() => expect(mocks.post).toHaveBeenCalledOnce());
    beginLogout();
    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toEqual({
      success: false,
      expiredSession: false,
      shouldLogin: true,
    });
    expect(mocks.post).toHaveBeenCalledOnce();
  });

  it("stops retrying after the maximum number of 409 responses", async () => {
    vi.useFakeTimers();
    mocks.post.mockRejectedValue(errorWithStatus(409));

    const resultPromise = refreshAuth();
    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toEqual({
      success: false,
      expiredSession: false,
      shouldLogin: false,
    });
    expect(mocks.post).toHaveBeenCalledTimes(6);
    expect(consoleLog).toHaveBeenCalledOnce();
  });

  it("clears token and profile after a 401 response", async () => {
    store.dispatch(setToken("old-token"));
    mocks.post.mockRejectedValueOnce(errorWithStatus(401));

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
      address: "",
      role: "user",
    });
  });

  it("clears credentials and requests login after a 403 response", async () => {
    store.dispatch(setToken("old-token"));
    mocks.post.mockRejectedValueOnce(errorWithStatus(403));

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
    mocks.post.mockRejectedValueOnce(error);

    await expect(refreshAuth()).resolves.toEqual({
      success: false,
      expiredSession: false,
      shouldLogin: false,
    });

    expect(store.getState().token.accessToken).toBe("old-token");
  });

  it("Keeps credentials for other HTTP errors without requesting login", async () => {
    store.dispatch(setToken("old-token"));
    mocks.post.mockRejectedValueOnce(errorWithStatus(500));

    await expect(refreshAuth()).resolves.toEqual({
      success: false,
      expiredSession: false,
      shouldLogin: false,
    });

    expect(store.getState().token.accessToken).toBe("old-token");
  });
});
