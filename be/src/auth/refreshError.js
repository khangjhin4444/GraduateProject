const DATABASE_ERROR_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "ENOTFOUND",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
]);

function isDatabaseUnavailableError(error) {
  const errors = [
    error,
    error?.sourceError,
    error?.cause,
    error?.sourceError?.cause,
  ];
  const hasDatabaseMessage = errors.some((candidate) =>
    candidate?.message?.toLowerCase().includes("error connecting to database"),
  );
  const hasNetworkCode = errors.some((candidate) =>
    DATABASE_ERROR_CODES.has(candidate?.code),
  );

  return hasDatabaseMessage || hasNetworkCode;
}

module.exports = { isDatabaseUnavailableError };
