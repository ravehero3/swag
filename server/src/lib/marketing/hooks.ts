import {
  upsertSubscriber,
  recordFreebie,
  markBuyer,
  addTagToSubscriber,
  getSubscriberByEmail,
} from "./subscribers.js";
import { enrollByTrigger } from "./journeys.js";

// ─────────────────────────────────────────────────────────────────────────────
// Event hooks — the ONLY integration surface the rest of the app needs to
// call. Every call site (leads.ts, orders.ts, index.ts GoPay IPN, auth.ts
// register) calls one of these two functions. Keeping this as a single
// choke point means: (a) freebie/purchase automation logic never has to be
// duplicated across 5 call sites, and (b) if a trigger needs a new side
// effect later, it's added here once.
//
// Both functions are designed to be called with `.catch(() => {})` from
// existing code, exactly like the existing sendXxxEmail(...).catch(...)
// pattern already used everywhere in this codebase — a marketing hook
// failure must NEVER break the underlying free-download or purchase flow.
// ─────────────────────────────────────────────────────────────────────────────

export interface FreebieDownloadEvent {
  email: string;
  userId?: number | null;
  name?: string | null;
  items: Array<{ title?: string; productType?: string; productId?: number }>;
  source?: string; // e.g. "checkout_free_item"
  marketingConsent?: boolean; // only true if the UI actually collected explicit consent
}

export async function onFreebieDownloaded(event: FreebieDownloadEvent): Promise<void> {
  try {
    if (!event.email || !event.items || event.items.length === 0) return;

    const firstItem = event.items[0];
    const subscriber = await upsertSubscriber({
      email: event.email,
      userId: event.userId,
      name: event.name,
      source: event.source || "freebie_download",
      freebieTitle: firstItem?.title || null,
      marketingConsent: event.marketingConsent,
      consentSource: event.source || "freebie_download",
    });

    for (const item of event.items) {
      await recordFreebie(subscriber.id, {
        productTitle: item.title || null,
        productType: item.productType || null,
        productId: item.productId || null,
        source: event.source || "freebie_download",
      });
    }

    await addTagToSubscriber(subscriber.id, "freebie");
    if (firstItem?.title) {
      // Best-effort light tagging by keyword — cheap "interest" signal.
      const lower = firstItem.title.toLowerCase();
      if (lower.includes("808")) await addTagToSubscriber(subscriber.id, "808");
      if (lower.includes("drum")) await addTagToSubscriber(subscriber.id, "drums");
      if (lower.includes("midi")) await addTagToSubscriber(subscriber.id, "midi");
    }

    await enrollByTrigger("freebie_downloaded", firstItem?.title || null, subscriber.id);

    console.log(`[Marketing] freebie.recorded subscriber=${subscriber.id} email=${event.email}`);
  } catch (err) {
    console.error("[Marketing] onFreebieDownloaded hook failed (non-fatal):", err);
  }
}

export interface OrderCompletedEvent {
  orderId: number;
  email: string;
  userId?: number | null;
  items: Array<{ title?: string; productType?: string; productId?: number }>;
}

export async function onOrderCompleted(event: OrderCompletedEvent): Promise<void> {
  try {
    if (!event.email) return;

    const subscriber = await upsertSubscriber({
      email: event.email,
      userId: event.userId,
      source: "purchase",
    });

    await markBuyer(subscriber.id);
    await addTagToSubscriber(subscriber.id, "buyer");

    const hasBeat = (event.items || []).some((i) => i.productType === "beat");
    const hasKit = (event.items || []).some((i) => i.productType === "sound_kit");
    if (hasBeat) await addTagToSubscriber(subscriber.id, "beat-buyer");
    if (hasKit) await addTagToSubscriber(subscriber.id, "kit-buyer");

    await enrollByTrigger("order_completed", null, subscriber.id);

    console.log(`[Marketing] order.completed_hook subscriber=${subscriber.id} order=${event.orderId}`);
  } catch (err) {
    console.error("[Marketing] onOrderCompleted hook failed (non-fatal):", err);
  }
}

export interface SignupEvent {
  email: string;
  userId: number;
  source?: string;
}

export async function onUserSignedUp(event: SignupEvent): Promise<void> {
  try {
    if (!event.email) return;
    const subscriber = await upsertSubscriber({
      email: event.email,
      userId: event.userId,
      source: event.source || "signup",
      // No implicit marketing consent on signup — spec §6/§53: consent must
      // be explicit. A signup alone does not opt someone into marketing.
    });
    await enrollByTrigger("subscriber_created", null, subscriber.id);
  } catch (err) {
    console.error("[Marketing] onUserSignedUp hook failed (non-fatal):", err);
  }
}
