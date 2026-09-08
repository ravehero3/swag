import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Signed unsubscribe tokens. Reuses the existing SESSION_SECRET so no new
// environment variable is required. Tokens are HMAC-signed and embed the
// subscriber id + issue time — they never expose raw DB ids without a
// verifiable signature, and can't be forged without the server secret.
// ─────────────────────────────────────────────────────────────────────────────

function getSecret(): string {
  return process.env.SESSION_SECRET || "voodoo808_stable_secret_12345";
}

export function createUnsubscribeToken(subscriberId: number): string {
  const payload = `${subscriberId}.${Date.now()}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex").slice(0, 32);
  const token = Buffer.from(`${payload}.${sig}`).toString("base64url");
  return token;
}

export function verifyUnsubscribeToken(token: string): { subscriberId: number } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length !== 3) return null;
    const [idStr, ts, sig] = parts;
    const payload = `${idStr}.${ts}`;
    const expectedSig = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex").slice(0, 32);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
    const subscriberId = parseInt(idStr, 10);
    if (Number.isNaN(subscriberId)) return null;
    return { subscriberId };
  } catch {
    return null;
  }
}
