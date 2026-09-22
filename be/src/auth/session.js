const DEFAULT_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;

function getSessionTtlMs() {
  const configuredTtl = Number(process.env.AUTH_SESSION_TTL_MS);
  return Number.isFinite(configuredTtl) && configuredTtl > 0
    ? configuredTtl
    : DEFAULT_SESSION_TTL_MS;
}

function createSessionExpiry(now = Date.now()) {
  return new Date(now + getSessionTtlMs());
}

function getRemainingSessionMs(sessionExpiresAt, now = Date.now()) {
  const expiry = new Date(sessionExpiresAt).getTime();
  return expiry - now;
}

function getTokenTtlSeconds(remainingSessionMs) {
  return Math.max(1, Math.ceil(remainingSessionMs / 1000));
}

function getAccessTokenTtlSeconds(remainingSessionMs) {
  const configuredTtl = Number(process.env.AUTH_ACCESS_TOKEN_TTL_MS);
  const accessTokenTtlMs =
    Number.isFinite(configuredTtl) && configuredTtl > 0
      ? configuredTtl
      : DEFAULT_ACCESS_TOKEN_TTL_MS;

  return getTokenTtlSeconds(Math.min(accessTokenTtlMs, remainingSessionMs));
}

module.exports = {
  createSessionExpiry,
  getAccessTokenTtlSeconds,
  getRemainingSessionMs,
  getTokenTtlSeconds,
};
