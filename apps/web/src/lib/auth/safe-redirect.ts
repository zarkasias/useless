const FALLBACK = "/dashboard";
const BASE_URL = "https://redirect.invalid";

export function safeLoginRedirect(next: unknown): string {
  if (
    typeof next !== "string" ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    /[\\\u0000-\u0020\u007f]/.test(next)
  ) {
    return FALLBACK;
  }

  try {
    const url = new URL(next, BASE_URL);
    if (url.origin !== BASE_URL || url.pathname.startsWith("//")) {
      return FALLBACK;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return FALLBACK;
  }
}
