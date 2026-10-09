const assert = require("node:assert/strict");
const test = require("node:test");

const { revokeRefreshSession } = require("../src/auth/logout");

function createSqlMock() {
  const statements = [];
  const sql = (strings, ...values) => ({
    text: strings.join("?"),
    values,
  });
  sql.transaction = async (queries) => {
    statements.push(...queries);
  };

  return { sql, statements };
}

test("logout locks the refresh token and revokes its rotated replacement", async () => {
  const { sql, statements } = createSqlMock();
  const refreshReplayCache = new Map([["old-refresh-token", {}]]);

  await revokeRefreshSession(sql, refreshReplayCache, "old-refresh-token");

  assert.equal(statements.length, 3);
  assert.match(statements[0].text, /pg_advisory_xact_lock/);
  assert.deepEqual(statements[0].values, ["old-refresh-token"]);
  assert.match(statements[1].text, /refresh_token_replays/);
  assert.match(statements[1].text, /DELETE FROM "refresh_tokens"/);
  assert.match(statements[2].text, /DELETE FROM "refresh_token_replays"/);
  assert.deepEqual(statements[2].values, ["old-refresh-token"]);
  assert.equal(refreshReplayCache.has("old-refresh-token"), false);
});

test("logout does not clear the replay cache when revocation fails", async () => {
  const { sql } = createSqlMock();
  sql.transaction = async () => {
    throw new Error("database unavailable");
  };
  const refreshReplayCache = new Map([["old-refresh-token", {}]]);

  await assert.rejects(
    revokeRefreshSession(sql, refreshReplayCache, "old-refresh-token"),
    /database unavailable/,
  );
  assert.equal(refreshReplayCache.has("old-refresh-token"), true);
});
