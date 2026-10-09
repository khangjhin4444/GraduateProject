async function revokeRefreshSession(sql, refreshReplayCache, refreshToken) {
  await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${refreshToken}, 0))`,
    sql`
      WITH replayed_refresh AS MATERIALIZED (
        SELECT "RefreshToken"
        FROM "refresh_token_replays"
        WHERE "Token" = ${refreshToken} AND "ExpiresAt" > NOW()
      )
      DELETE FROM "refresh_tokens"
      WHERE "token" = ${refreshToken}
        OR "token" IN (SELECT "RefreshToken" FROM replayed_refresh)
    `,
    sql`DELETE FROM "refresh_token_replays" WHERE "Token" = ${refreshToken}`,
  ]);

  refreshReplayCache.delete(refreshToken);
}

module.exports = { revokeRefreshSession };
