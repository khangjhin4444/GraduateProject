import type { BrowserContext, Page } from "@playwright/test";
import { NETWORK } from "./config";

export async function applyNetworkConditions(
  context: BrowserContext,
  page: Page,
) {
  const client = await context.newCDPSession(page);
  await client.send("Network.enable");
  await client.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: NETWORK.latencyMs,
    downloadThroughput: NETWORK.downloadBytesPerSec,
    uploadThroughput: -1,
  });
}
