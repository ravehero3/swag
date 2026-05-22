/** Normalise APP_URL / domain strings (trim, strip trailing slash, ensure https://). */
export function normaliseAppUrl(raw: string): string {
  let d = raw.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(d)) d = `https://${d}`;
  return d;
}

/** Production site base URL from APP_URL, Replit env, or localhost fallback. */
export function getAppBaseUrl(): string {
  const raw =
    process.env.APP_URL ||
    (process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0].trim()}`
      : null) ||
    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null) ||
    "http://localhost:5000";
  return normaliseAppUrl(raw);
}

/** OAuth redirect URI sent to Google (must match Google Cloud Console exactly). */
export function getGoogleOAuthCallbackUrl(): string {
  if (process.env.GOOGLE_CALLBACK_URL?.trim()) {
    return process.env.GOOGLE_CALLBACK_URL.trim().replace(/\/+$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    return `${getAppBaseUrl()}/api/auth/google/callback`;
  }
  return "/api/auth/google/callback";
}

/** www ↔ non-www variant for registering both redirect URIs in Google Console. */
export function alternateAppBaseUrl(base: string): string {
  if (base.includes("://www.")) return base.replace("://www.", "://");
  const proto = base.startsWith("https") ? "https" : "http";
  const host = base.replace(/^https?:\/\//, "");
  return `${proto}://www.${host}`;
}
