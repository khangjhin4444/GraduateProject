const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createSessionExpiry,
  getAccessTokenTtlSeconds,
  getRemainingSessionMs,
  getTokenTtlSeconds,
} = require("../src/auth/session");

test("session expiry uses the configured test TTL", () => {
  const originalTtl = process.env.AUTH_SESSION_TTL_MS;
  process.env.AUTH_SESSION_TTL_MS = "5000";

  try {
    const now = 1_700_000_000_000;
    assert.equal(createSessionExpiry(now).getTime(), now + 5000);
  } finally {
    if (originalTtl === undefined) delete process.env.AUTH_SESSION_TTL_MS;
    else process.env.AUTH_SESSION_TTL_MS = originalTtl;
  }
});

test("remaining session time does not reset during refresh", () => {
  const sessionExpiresAt = new Date(1_700_000_005_000);

  assert.equal(
    getRemainingSessionMs(sessionExpiresAt, 1_700_000_002_000),
    3000,
  );
  assert.equal(getRemainingSessionMs(sessionExpiresAt, 1_700_000_004_999), 1);
});

test("JWT and cookie TTL follows the remaining absolute session time", () => {
  assert.equal(getTokenTtlSeconds(5000), 5);
  assert.equal(getTokenTtlSeconds(4501), 5);
  assert.equal(getTokenTtlSeconds(0), 1);
});

test("access token TTL can be shortened for testing and cannot exceed session TTL", () => {
  const originalTtl = process.env.AUTH_ACCESS_TOKEN_TTL_MS;
  process.env.AUTH_ACCESS_TOKEN_TTL_MS = "2000";

  try {
    assert.equal(getAccessTokenTtlSeconds(5000), 2);
    assert.equal(getAccessTokenTtlSeconds(1000), 1);
  } finally {
    if (originalTtl === undefined) delete process.env.AUTH_ACCESS_TOKEN_TTL_MS;
    else process.env.AUTH_ACCESS_TOKEN_TTL_MS = originalTtl;
  }
});
