type EventParams = Record<string, string | number | boolean>;

/**
 * Sends an event to Google Analytics (loaded in the root layout). Does
 * nothing when the tag is missing or blocked, and never throws, so tracking
 * can't break the page. Synchronous, so it's safe to call inside a tap
 * handler before navigator.share.
 */
export function trackEvent(name: string, params: EventParams = {}) {
  try {
    const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;

    gtag?.("event", name, params);
  } catch {
    // Analytics must never get in the way.
  }
}
