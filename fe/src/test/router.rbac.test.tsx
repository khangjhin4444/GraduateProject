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

function setAuthenticatedRole(role: "admin" | "user") {
  store.dispatch(setToken("test-access-token"));
  store.dispatch(
    setInfo({
      id: 7,
      fullName: "RBAC Test User",
      phoneNumber: "",
      address: "",
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
      protectedRoute: "/product/order",
    },
    {
      protectedRoute: "/checkout",
    },
  ])(
    "redirects unauthenticated visitors from admin routes or authenticated routes to login",
    async ({ protectedRoute }) => {
      const router = renderRoute(protectedRoute);

      await waitFor(() => {
        expect(router.state.location.pathname).toBe("/login");
      });
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
});
