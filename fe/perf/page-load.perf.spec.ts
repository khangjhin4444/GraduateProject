import { test, expect, type Browser } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  ROUTES,
  ENDPOINTS,
  RUNS,
  WARMUP,
  P95_BUDGET_MS,
  type RouteDef,
} from "./config";
import { applyNetworkConditions } from "./network";
import { percentile } from "./stats";
import { loginViaApi, logoutViaApi } from "./session";

async function measureOnce(browser: Browser, baseURL: string, route: RouteDef) {
  const context = await browser.newContext({ baseURL });
  try {
    // 1) Login TRƯỚC khi throttle, không tính vào số đo
    if (route.auth) await loginViaApi(context);

    const page = await context.newPage();
    await applyNetworkConditions(context, page); // 2) bật throttle

    // 3) Theo dõi lượt refresh token mà app tự gọi khi boot
    const refreshPromise = route.auth
      ? page
          .waitForResponse((r) => r.url().includes(ENDPOINTS.refresh), {
            timeout: 30_000,
          })
          .catch(() => null)
      : null;

    // 4) Đo từ lúc điều hướng đến lúc trang dùng được
    let t0: number;
    if (route.prepare) {
      // Tạo state bằng điều hướng thật (không tính giờ), rồi đo lần reload
      await route.prepare(page);
      await page
        .locator(route.ready)
        .waitFor({ state: "visible", timeout: 30_000 }); // đảm bảo trang đã lên
      await page.evaluate(() => performance.clearResourceTimings());
      t0 = Date.now();
      await page.reload({ waitUntil: "commit" });
    } else {
      t0 = Date.now();
      await page.goto(route.path, { waitUntil: "commit" });
    }
    await page
      .locator(route.ready)
      .waitFor({ state: "visible", timeout: 30_000 });
    const readyMs = Date.now() - t0;

    // 5) Xác nhận phiên hợp lệ: nếu bị đẩy về /login thì số đo là của trang khác
    if (refreshPromise) {
      const refresh = await refreshPromise;
      expect(refresh, `app không gọi ${ENDPOINTS.refresh}`).not.toBeNull();
      expect(refresh!.status(), "refresh phải trả 200").toBe(200);
      expect(new URL(page.url()).pathname).toBe(route.path);
    }
    return readyMs;
  } finally {
    if (route.auth) await logoutViaApi(context);
    await context.close();
  }
}

for (const route of ROUTES) {
  test(`p95 < ${P95_BUDGET_MS}ms: ${route.path}`, async ({
    browser,
    baseURL,
  }) => {
    const samples: number[] = [];

    for (let i = 0; i < RUNS + WARMUP; i++) {
      const ms = await measureOnce(browser, baseURL!, route);
      if (i >= WARMUP) samples.push(ms);
    }

    const p95 = percentile(samples, 95);
    const p50 = percentile(samples, 50);
    const max = Math.max(...samples);
    console.log(
      `${route.path.padEnd(20)} p50=${p50}ms  p95=${p95}ms  max=${max}ms  (n=${samples.length})`,
    );

    // Lưu mẫu thô làm bằng chứng
    mkdirSync("perf-results", { recursive: true });
    writeFileSync(
      `perf-results/${route.path.replace(/\W+/g, "_") || "root"}.json`,
      JSON.stringify({ route: route.path, p50, p95, max, samples }, null, 2),
    );

    expect(p95, `p95 của ${route.path}`).toBeLessThan(P95_BUDGET_MS);
  });
}
