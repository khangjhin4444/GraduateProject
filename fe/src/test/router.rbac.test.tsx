import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { createMemoryRouter, RouterProvider } from "react-router";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { refreshAuth } from "@/lib/authRefresh";
import { routeConfig } from "@/router";
import { deleteInfo, setInfo } from "@/state/profile/profileSlice";
import { deleteToken, setToken } from "@/state/token/tokenSlice";
import { store } from "@/state/store";

vi.mock("@/lib/authRefresh", () => ({
  refreshAuth: vi.fn(),
}));

const routers: ReturnType<typeof createMemoryRouter>[] = [];

function renderRoute(path: string) {
  const router = createMemoryRouter(routeConfig, {
    initialEntries: [path],
  });
  routers.push(router);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </Provider>,
  );
  return router;
}

const findLoaderByPath = (
  routes: any[],
  targetPath: string,
): Function | undefined => {
  for (const route of routes) {
    if (route.path === targetPath && route.loader) {
      return route.loader;
    }
    if (route.children) {
      const found = findLoaderByPath(route.children, targetPath);
      if (found) return found;
    }
  }
  return undefined;
};

function setAuthenticatedRole(role: "admin" | "user") {
  store.dispatch(setToken("test-access-token"));
  store.dispatch(
    setInfo({
      id: 7,
      fullName: "RBAC Test User",
      phoneNumber: "",
      provinceName: "",
      street: "",
      wardName: "",
      role,
    }),
  );
}

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn();
});

describe("router role-based access control", () => {
  beforeEach(() => {
    store.dispatch(deleteToken());
    store.dispatch(deleteInfo());
    vi.mocked(refreshAuth).mockResolvedValue({
      success: false,
      expiredSession: false,
      shouldLogin: true,
    });
  });

  afterEach(() => {
    cleanup();
    routers.splice(0).forEach((router) => router.dispose());
    store.dispatch(deleteToken());
    store.dispatch(deleteInfo());
    vi.clearAllMocks();
  });

  it.each([
    {
      protectedRoute: "/admin/dashboard",
    },
    {
      protectedRoute: "/admin/products",
    },
    {
      protectedRoute: "/admin/orders",
    },
    {
      protectedRoute: "/product/1",
    },
    {
      protectedRoute: "/cart",
    },
    {
      protectedRoute: "/order",
    },
    {
      protectedRoute: "/checkout",
    },
  ])(
    "redirects unauthenticated visitors from $protectedRoute to login",
    async ({ protectedRoute }) => {
      const router = renderRoute(protectedRoute);

      await waitFor(
        () => {
          expect(router.state.location.pathname).toBe("/login");
        },
        { timeout: 5000 },
      );
      expect(await screen.findByText("Login Account")).toBeVisible();
    },
  );

  it.each([
    { protectedRoute: "/admin/dashboard" },
    { protectedRoute: "/admin/products" },
    { protectedRoute: "/admin/orders" },
  ])("forbids an authenticated user from entering admin routes", async () => {
    setAuthenticatedRole("user");
    const router = renderRoute("/admin/dashboard");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/forbidden");
    });
    expect(await screen.findByText("403 Forbidden")).toBeVisible();
  });

  it("allows an administrator to enter the admin dashboard", async () => {
    setAuthenticatedRole("admin");
    const router = renderRoute("/admin/dashboard");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/admin/dashboard");
    });
    expect(
      await screen.findByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  });

  it("redirects administrators from storefront routes back to the dashboard", async () => {
    setAuthenticatedRole("admin");
    const router = renderRoute("/home");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/admin");
    });
    expect(
      await screen.findByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  });
  it("show authentiaction service error", async () => {
    vi.mocked(refreshAuth).mockResolvedValue({
      success: false,
      expiredSession: false,
      shouldLogin: false,
    });
    const router = renderRoute("/product/1");
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/product/1");
    });
    expect(
      await screen.findByText(/Authentication service temporarily unavailable/),
    ).toBeVisible();
  });
  it("redirects administrators from /admin routes to the dashboard", async () => {
    setAuthenticatedRole("admin");
    const router = renderRoute("/admin");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/admin");
    });
    expect(
      await screen.findByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  });
  it("return valid keyword", () => {
    const loader = findLoaderByPath(
      routeConfig,
      "/search/:keyword?",
    ) as Function;
    expect(loader).toBeDefined();

    const result = loader({ params: { keyword: "switch" } });
    expect(result).toEqual({ keyword: "switch" });
  });

  it("redirect /home if no keyword", () => {
    const loader = findLoaderByPath(
      routeConfig,
      "/search/:keyword?",
    ) as Function;
    const result = loader({ params: {} });
    expect(result.headers.get("Location")).toBe("/home");
  });
  it("redirect /home if no type after collection", () => {
    const loader = findLoaderByPath(
      routeConfig,
      "/collection/:type?/:sub?",
    ) as Function;
    const result = loader({ params: {} });
    expect(result.headers.get("Location")).toBe("/home");
  });
  it("redirect /not-found if type and/or sub invalid", () => {
    const loader = findLoaderByPath(
      routeConfig,
      "/collection/:type?/:sub?",
    ) as Function;
    const result = loader({ params: { type: "invalid", sub: "invalid" } });
    expect(result.headers.get("Location")).toBe("/not-found");
    const result2 = loader({ params: { type: "keyboardkit", sub: "invalid" } });
    expect(result2.headers.get("Location")).toBe("/not-found");
  });
  it("return valid type and sub", () => {
    const loader = findLoaderByPath(
      routeConfig,
      "/collection/:type?/:sub?",
    ) as Function;

    expect(loader).toBeDefined();

    const result = loader({ params: { type: "keyboardkit", sub: "tkl" } });
    expect(result).toEqual({ type: "keyboardkit", sub: "tkl" });
  });
});
