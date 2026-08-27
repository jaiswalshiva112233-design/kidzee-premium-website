type PublicPersistenceError = {
  status: number;
  message: string;
};

function errorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";
}

function internalMessage(error: unknown) {
  return error instanceof Error ? error.message : "";
}

/**
 * Translate persistence failures at the API boundary. Technical details stay
 * in server logs; this function deliberately never returns the original error.
 */
export function publicPersistenceError(
  error: unknown,
  fallback: string,
): PublicPersistenceError {
  const code = errorCode(error);
  const message = internalMessage(error);

  if (code === "P2034" || /serialization|deadlock/i.test(message)) {
    return {
      status: 409,
      message:
        "Another update was saved at the same time. Refresh and try once more.",
    };
  }

  if (code === "P2002" || /23505/.test(message)) {
    return {
      status: 409,
      message:
        "A matching record already exists. Refresh and open the existing record.",
    };
  }

  if (code === "P2003" || /23503/.test(message)) {
    return {
      status: 409,
      message:
        "This record is still linked to centre history and cannot be removed. Archive it to keep those records safely.",
    };
  }

  if (code === "P2025") {
    return {
      status: 404,
      message: "This record no longer exists. Refresh the page and try again.",
    };
  }

  if (code === "P2004" || /23514|check constraint/i.test(message)) {
    return {
      status: 409,
      message:
        "We couldn’t update this record because some saved details are no longer valid. Review the details or contact the Owner.",
    };
  }

  return { status: 500, message: fallback };
}
