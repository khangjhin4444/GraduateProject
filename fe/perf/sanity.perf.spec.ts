// perf/sanity.perf.spec.ts
import { test, expect } from "@playwright/test";
import { applyNetworkConditions } from "./network";
import { NETWORK } from "./config";

test("sanity: throttle ~10 Mbps hoạt động", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await applyNetworkConditions(context, page);

  await page.goto("/login", { waitUntil: "load" });

  const result = await page.evaluate(async () => {
    const scripts = (
      performance.getEntriesByType("resource") as PerformanceResourceTiming[]
    )
      .filter(
        (e) => e.initiatorType === "script" || /\.m?js(\?|$)/.test(e.name),
      )
      .sort((a, b) => b.encodedBodySize - a.encodedBodySize);
    if (scripts.length === 0) return null;

    const url =
      scripts[0].name +
      (scripts[0].name.includes("?") ? "&" : "?") +
      "sanity=" +
      Date.now();
    const t = performance.now();
    await (await fetch(url, { cache: "no-store" })).arrayBuffer();
    const ms = performance.now() - t;

    // Lấy dung lượng THỰC TẾ trên đường truyền của lần fetch vừa rồi
    const entry = (
      performance.getEntriesByName(url) as PerformanceResourceTiming[]
    ).pop();
    return {
      url,
      ms,
      wireBytes: entry?.transferSize ?? 0,
      bodyBytes: entry?.encodedBodySize ?? 0,
    };
  });

  expect(result, "Trang không tải file JS nào").not.toBeNull();
  const { url, ms, wireBytes, bodyBytes } = result!;
  expect(wireBytes, "Không đọc được transferSize").toBeGreaterThan(0);

  const transferMs = ms - NETWORK.latencyMs; // trừ độ trễ 50 ms
  const mbps = (wireBytes * 8) / (transferMs / 1000) / 1_000_000;
  const expectedMs =
    NETWORK.latencyMs + (wireBytes / NETWORK.downloadBytesPerSec) * 1000;

  console.log(`File: ${url}`);
  console.log(
    `Truyền thực tế: ${(wireBytes / 1024).toFixed(0)} KB (body ${(bodyBytes / 1024).toFixed(0)} KB)`,
  );
  console.log(
    `Đo được: ${ms.toFixed(0)} ms, lý thuyết ở 10 Mbps: ${expectedMs.toFixed(0)} ms => ~${mbps.toFixed(1)} Mbps`,
  );

  expect(wireBytes, "File quá nhỏ, phép đo không đáng tin").toBeGreaterThan(
    100 * 1024,
  );
  expect(mbps).toBeLessThan(12);

  await context.close();
});
