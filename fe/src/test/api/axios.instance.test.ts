import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { privateApi, publicApi } from "@/api/axios.instance";
import { store } from "@/state/store";
import { setToken } from "@/state/token/tokenSlice";
import { z } from "zod";

const mocks = vi.hoisted(() => ({
  refreshAuth: vi.fn(),
  logoutInProgress: false,
}));

vi.mock("@/lib/authRefresh", () => ({
  refreshAuth: mocks.refreshAuth,
}));

vi.mock("@/lib/authLifecycle", () => ({
  isLogoutInProgress: () => mocks.logoutInProgress,
}));

function response(
  config: InternalAxiosRequestConfig,
  data: unknown,
  status = 200,
): AxiosResponse {
  return {
    config,
    data,
    status,
    statusText: status === 200 ? "OK" : "Unauthorized",
    headers: new AxiosHeaders(),
  };
}

function failedResponse(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
) {
  return new AxiosError(
    "Request failed",
    undefined,
    config,
    undefined,
    response(config, data, status),
  );
}

describe("axios instances", () => {
  let originalPublicAdapter: AxiosAdapter;
  let originalPrivateAdapter: AxiosAdapter;

  beforeEach(() => {
    originalPublicAdapter = publicApi.defaults.adapter as AxiosAdapter;
    originalPrivateAdapter = privateApi.defaults.adapter as AxiosAdapter;
    store.dispatch(setToken(""));
    mocks.refreshAuth.mockReset();
    mocks.logoutInProgress = false;
  });

  afterEach(() => {
    publicApi.defaults.adapter = originalPublicAdapter;
    privateApi.defaults.adapter = originalPrivateAdapter;
    vi.unstubAllGlobals();
  });

  it.each([
    ["public", publicApi],
    ["private", privateApi],
  ] as const)(
    "rejects request setup errors for %s requests",
    async (_, api) => {
      const requestError = new AxiosError("Request setup failed");
      const interceptorId = api.interceptors.request.use(() =>
        Promise.reject(requestError),
      );

      try {
        await expect(api.get("/request")).rejects.toBe(requestError);
      } finally {
        api.interceptors.request.eject(interceptorId);
      }
    },
  );

  it("attaches the current bearer token to private requests", async () => {
    store.dispatch(setToken("access-token"));
    let authorization: unknown;
    privateApi.defaults.adapter = async (config) => {
      authorization = config.headers.get("Authorization");
      return response(config, { ok: true });
    };

    await privateApi.get("/private");

    expect(authorization).toBe("Bearer access-token");
  });

  it("does not attach a token to public requests", async () => {
    store.dispatch(setToken("access-token"));
    let authorization: unknown;
    publicApi.defaults.adapter = async (config) => {
      authorization = config.headers.get("Authorization");
      return response(config, { ok: true });
    };

    await publicApi.get("/public");

    expect(authorization).toBeUndefined();
  });

  it.each([
    ["public", publicApi],
    ["private", privateApi],
  ] as const)("validates and transforms %s API responses", async (_, api) => {
    api.defaults.adapter = async (config) =>
      response(config, { name: "keyboard" });

    const result = await api.get("/products", {
      responseSchema: z
        .object({ name: z.string() })
        .transform(({ name }) => name.toUpperCase()),
    });

    expect(result.data).toBe("KEYBOARD");
  });

  it.each([
    ["public", publicApi],
    ["private", privateApi],
  ] as const)("rejects invalid %s API response data", async (_, api) => {
    api.defaults.adapter = async (config) => response(config, { name: 12 });

    await expect(
      api.get("/products", {
        responseSchema: z.object({ name: z.string() }),
      }),
    ).rejects.toThrow("Wrong data format from server");
  });

  it.each([
    ["public", publicApi],
    ["private", privateApi],
  ] as const)(
    "uses the backend error message for %s API failures",
    async (_, api) => {
      api.defaults.adapter = async (config) => {
        throw failedResponse(config, 400, {
          success: false,
          message: "Invalid product",
        });
      };

      await expect(api.get("/products")).rejects.toMatchObject({
        message: "Invalid product",
      });
      expect(mocks.refreshAuth).not.toHaveBeenCalled();
    },
  );

  it("refreshes once and retries a private request with the new token after 401", async () => {
    store.dispatch(setToken("expired-token"));
    const authorizations: unknown[] = [];
    let requestCount = 0;
    privateApi.defaults.adapter = async (config) => {
      requestCount += 1;
      authorizations.push(config.headers.get("Authorization"));
      if (requestCount === 1) {
        throw failedResponse(config, 401, { message: "Unauthorized" });
      }
      return response(config, { ok: true });
    };
    mocks.refreshAuth.mockImplementation(async () => {
      store.dispatch(setToken("refreshed-token"));
      return { success: true, expiredSession: false, shouldLogin: false };
    });

    const result = await privateApi.get("/private");

    expect(result.data).toEqual({ ok: true });
    expect(mocks.refreshAuth).toHaveBeenCalledOnce();
    expect(requestCount).toBe(2);
    expect(authorizations).toEqual([
      "Bearer expired-token",
      "Bearer refreshed-token",
    ]);
  });

  it("does not retry a private request when token refresh fails", async () => {
    let requestCount = 0;
    privateApi.defaults.adapter = async (config) => {
      requestCount += 1;
      throw failedResponse(config, 401, { message: "Unauthorized" });
    };
    mocks.refreshAuth.mockResolvedValue({
      success: false,
      expiredSession: false,
      shouldLogin: false,
    });

    await expect(privateApi.get("/private")).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(mocks.refreshAuth).toHaveBeenCalledOnce();
    expect(requestCount).toBe(1);
  });

  it("does not retry a private request if logout starts while refresh is pending", async () => {
    let resolveRefresh!: (result: {
      success: boolean;
      expiredSession: boolean;
      shouldLogin: boolean;
    }) => void;
    mocks.refreshAuth.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    let requestCount = 0;
    privateApi.defaults.adapter = async (config) => {
      requestCount += 1;
      throw failedResponse(config, 401, { message: "Unauthorized" });
    };

    const request = privateApi.get("/private");
    await vi.waitFor(() =>
      expect(mocks.refreshAuth).toHaveBeenCalledOnce(),
    );
    mocks.logoutInProgress = true;
    resolveRefresh({ success: true, expiredSession: false, shouldLogin: false });

    await expect(request).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(requestCount).toBe(1);
  });

  it("redirects to login when refresh reports that the session should end", async () => {
    const fakeWindow = { location: { href: "" } };
    vi.stubGlobal("window", fakeWindow);
    privateApi.defaults.adapter = async (config) => {
      throw failedResponse(config, 401, { message: "Unauthorized" });
    };
    mocks.refreshAuth.mockResolvedValue({
      success: false,
      expiredSession: false,
      shouldLogin: true,
    });

    await expect(privateApi.get("/private")).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(fakeWindow.location.href).toBe("/login");
  });

  it("does not refresh repeatedly when the retried request also returns 401", async () => {
    let requestCount = 0;
    privateApi.defaults.adapter = async (config) => {
      requestCount += 1;
      throw failedResponse(config, 401, { message: "Unauthorized" });
    };
    mocks.refreshAuth.mockResolvedValue({
      success: true,
      expiredSession: false,
      shouldLogin: false,
    });

    await expect(privateApi.get("/private")).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(mocks.refreshAuth).toHaveBeenCalledOnce();
    expect(requestCount).toBe(2);
  });
});
