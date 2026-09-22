const assert = require("node:assert/strict");
const test = require("node:test");

const { isDatabaseUnavailableError } = require("../src/auth/refreshError");

test("recognizes Neon database connection errors", () => {
  assert.equal(
    isDatabaseUnavailableError({
      sourceError: { cause: { code: "UND_ERR_CONNECT_TIMEOUT" } },
    }),
    true,
  );
  assert.equal(isDatabaseUnavailableError({ code: "ECONNRESET" }), true);
  assert.equal(
    isDatabaseUnavailableError({ message: "Error connecting to database" }),
    true,
  );
});

test("recognizes nested DNS and connection refusal errors", () => {
  assert.equal(
    isDatabaseUnavailableError({
      cause: { code: "ENOTFOUND" },
    }),
    true,
  );
  assert.equal(
    isDatabaseUnavailableError({
      sourceError: { cause: { code: "ECONNREFUSED" } },
    }),
    true,
  );
});

test("does not classify an expired JWT as a database error", () => {
  assert.equal(
    isDatabaseUnavailableError({
      name: "TokenExpiredError",
      message: "jwt expired",
    }),
    false,
  );
});
