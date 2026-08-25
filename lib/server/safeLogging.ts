import "server-only";

function safeErrorType(error: unknown) {
  if (!(error instanceof Error)) return "UnknownError";

  const cleaned = error.name
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 48);

  return cleaned || "Error";
}

export function logServerError(context: string, error: unknown) {
  console.error(context, { errorType: safeErrorType(error) });
}

export function logServerWarning(context: string, error: unknown) {
  console.warn(context, { errorType: safeErrorType(error) });
}
