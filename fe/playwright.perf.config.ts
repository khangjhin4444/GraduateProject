import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./perf",
  testMatch: /.*\.perf\.spec\.ts/,
  fullyParallel: false,
  workers: 1, // chạy tuần tự, các test không tranh tài nguyên của nhau
  retries: 0, // không retry, tránh che số đo xấu
  timeout: 15 * 60_000,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:4173",
  },
});
