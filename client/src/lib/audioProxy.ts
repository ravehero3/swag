export function toAudioProxyUrl(url: string): string {
  if (!url) return url;
  if (!url.startsWith("http")) return url;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (url.startsWith(origin)) return url;
  return `/api/audio-proxy?url=${encodeURIComponent(url)}`;
}
