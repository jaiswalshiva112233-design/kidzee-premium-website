export const MARKETING_MAX_ATTEMPTS = 8;

const BASE_RETRY_MS = 5 * 60 * 1000;
const MAX_RETRY_MS = 24 * 60 * 60 * 1000;

export function marketingRetryDelay(attempts: number) {
  return Math.min(
    MAX_RETRY_MS,
    BASE_RETRY_MS * 2 ** Math.max(0, Math.trunc(attempts) - 1),
  );
}
