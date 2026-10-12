import { Page } from "@playwright/test";

export type RouteDef = {
  path: string;
  auth: boolean;
  ready: string;
  prepare?: (page: Page) => Promise<void>;
};

const READY = '[data-testid="page-ready"]';

// Liệt kê TOÀN BỘ route. Route động: dùng ID cụ thể của bản ghi nặng nhất.
export const ROUTES: RouteDef[] = [
  { path: "/login", auth: false, ready: READY },
  { path: "/home", auth: false, ready: READY },
  { path: "/collection/keyboardkit", auth: false, ready: READY },
  { path: "/collection/prebuild", auth: false, ready: READY },
  { path: "/collection/keycap", auth: false, ready: READY },
  { path: "/product/10", auth: true, ready: READY },
  { path: "/cart", auth: true, ready: READY },
  { path: "/order", auth: true, ready: READY },
  {
    path: "/checkout",
    auth: true,
    ready: '[data-testid="checkout-ready"]',
    prepare: async (page) => {
      await page.goto("/cart");
      await page.locator(READY).waitFor({ state: "visible", timeout: 30_000 });
      await page.getByRole("button", { name: /checkout/i }).click();
      await page.waitForURL("**/checkout");
    },
  },
];

export const ENDPOINTS = {
  login: "http://localhost:8000/api/auth/login",
  refresh: "http://localhost:8000/api/auth/refresh",
  logout: "http://localhost:8000/api/auth/logout",
};

export const RUNS = Number(30);
export const WARMUP = 2;
export const P95_BUDGET_MS = 5000;

// NFR: 10 Mbps download, 50 ms latency
export const NETWORK = {
  latencyMs: 50,
  downloadBytesPerSec: (10 * 1_000_000) / 8, // = 1.250.000 B/s
};
