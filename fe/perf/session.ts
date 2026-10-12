import { expect, type BrowserContext } from "@playwright/test";
import { ENDPOINTS } from "./config";

export async function loginViaApi(context: BrowserContext) {
  const res = await context.request.post(ENDPOINTS.login, {
    data: { username: "testuser", password: "A12345678" },
  });
  expect(res.ok(), `login thất bại: HTTP ${res.status()}`).toBeTruthy();
  // Set-Cookie (refresh token httpOnly) đã tự được lưu vào context
}

export async function logoutViaApi(context: BrowserContext) {
  // Dọn session trên backend; bỏ qua lỗi để không ảnh hưởng kết quả
  await context.request.post(ENDPOINTS.logout).catch(() => {});
}
