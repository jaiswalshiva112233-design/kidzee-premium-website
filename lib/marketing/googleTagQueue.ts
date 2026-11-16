type GoogleTagTarget = {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

/** Keep Google's command protocol, not just its array-like argument values. */
export function ensureGoogleTagQueue(target: GoogleTagTarget) {
  target.dataLayer ??= [];
  target.gtag ??= function gtag() {
    // Google's bootstrap queues the real Arguments object. A rest-parameter
    // array can be ignored instead of becoming a consent/config/event command.
    // eslint-disable-next-line prefer-rest-params
    target.dataLayer?.push(arguments);
  };
  return target.gtag;
}
