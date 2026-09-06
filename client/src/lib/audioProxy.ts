const DIRECT_HOSTS = ["r2.dev", "cloudflarestorage.com", "backblazeb2.com"];

export function canDirectFetch(url: string): boolean {
  if (!url || !url.startsWith("http")) return true;
  try {
    const host = new URL(url).hostname;
    return DIRECT_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
}

export function toAudioProxyUrl(url: string): string {
  if (!url) return url;
  // If it's a relative local URL (/uploads/...), keep it as-is (will use /api/audio-proxy)
  if (url.startsWith("/") && url.includes("/uploads/")) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `/api/audio-proxy?url=${encodeURIComponent(origin + url)}`;
  }
  if (!url.startsWith("http")) return url;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (url.startsWith(origin)) return url;
  if (canDirectFetch(url)) return url;
  return `/api/audio-proxy?url=${encodeURIComponent(url)}`;
}
