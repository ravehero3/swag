# VOODOO808 Marketing Automation — Final Implementation Report

## Status: Phases 1–10 implemented. Phase 12 (automated test run / production build) could not be executed in this environment — see "Known Limitation" below. Manual review substituted where possible.

---

## 1. What Was Changed

A first-party marketing automation system was added **additively** on top of the existing Voodoo808
codebase. Nothing existing was renamed, deleted, or restructured. Existing transactional email
(`server/src/email.ts`), the `leads` table, the checkout flow, GoPay integration, and the admin panel's
existing tabs all continue to work exactly as before — the new system only adds hooks alongside them.

### New server modules
- `server/src/lib/marketing/subscribers.ts` — subscriber upsert (case-insensitive, deduped), tags,
  consent/unsubscribe/suppression, `isMarketingEligible()` gate, audit log writer.
- `server/src/lib/marketing/journeys.ts` — enrollment (idempotent), condition evaluator
  (`has_purchased`, `has_tag`, `not_has_tag`, `has_freebie`), step advancement engine.
- `server/src/lib/marketing/sender.ts` — Resend wrapper with idempotency keys, eligibility re-check,
  test-mode redirect, send logging, controlled `{{variable}}` substitution, auto-appended unsubscribe footer.
- `server/src/lib/marketing/scheduler.ts` — `setInterval`-based tick (every 2 min), Postgres advisory
  lock + `FOR UPDATE SKIP LOCKED` for concurrency safety.
- `server/src/lib/marketing/tokens.ts` — HMAC-signed unsubscribe tokens (reuses `SESSION_SECRET`).
- `server/src/lib/marketing/hooks.ts` — the single integration surface: `onFreebieDownloaded`,
  `onOrderCompleted`, `onUserSignedUp`.
- `server/src/middleware/rateLimit.ts` — minimal in-memory rate limiter (no new dependency).
- `server/src/routes/marketing.ts` — all admin marketing API endpoints + public unsubscribe endpoints.
- `server/src/routes/resendWebhook.ts` — Resend webhook receiver with Svix signature verification.

### New frontend
- `client/src/pages/OdhlasitMarketing.tsx` — public `/odhlasit-marketing` unsubscribe page.
- `client/src/pages/Admin.tsx` — 5 new Marketing sub-tabs (Přehled, Odběratelé, Journeys, Kampaně,
  Šablony) + a new Nastavení → "Marketing e-maily" sub-tab for test/production mode.

### Modified files (all additive)
- `server/src/db.ts` — new tables + seed data appended to the end of `initDatabase()`.
- `server/src/index.ts` — webhook route mount (raw body, before global JSON parser), marketing routes
  mount, scheduler start, marketing hook call in the GoPay IPN handler, Google-OAuth-signup hook.
- `server/src/routes/leads.ts` — rate limiter + `onFreebieDownloaded` hook call.
- `server/src/routes/orders.ts` — `onFreebieDownloaded` hook in `claim-free`; `onOrderCompleted` hook
  (via a new shared `notifyOrderCompletedForMarketing` helper) in `check-payment` and admin status change.
- `server/src/routes/auth.ts` — `onUserSignedUp` hook on register.
- `client/src/pages/Checkout.tsx` — explicit marketing-consent checkbox on the free-download form,
  wired through to both the logged-in (`claim-free`) and logged-out (`leads`) paths.
- `.env.example` — documented `RESEND_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`.
- `replit.md` — new "Marketing Automation" section documenting the architecture for future agents.

---

## 2. Database Changes

All changes are additive `CREATE TABLE IF NOT EXISTS` / idempotent seed inserts inside `initDatabase()`
— the exact same pattern already used for every other table in this codebase. No existing table was
altered, renamed, or had columns removed.

New tables: `subscribers`, `tags`, `subscriber_tags`, `subscriber_freebies`, `marketing_templates`,
`marketing_journeys`, `marketing_journey_steps`, `marketing_enrollments`, `marketing_segments`,
`marketing_campaigns`, `marketing_email_sends`, `marketing_email_events`, `marketing_audit_log`.

Key constraints/indexes:
- `subscribers.email_normalized` — `UNIQUE` index (case-insensitive dedupe).
- `marketing_enrollments (subscriber_id, journey_id)` — `UNIQUE` (prevents double-enrollment).
- `marketing_email_sends.idempotency_key` — `UNIQUE` (prevents duplicate sends on retry).
- `marketing_email_events.event_id` — `UNIQUE` partial index, NULLs excluded (idempotent webhook processing).
- `marketing_enrollments (status, next_run_at)` — supports the scheduler's due-row query efficiently.

Seed data (all inactive/draft, per spec §53 — historical leads are NOT auto-enrolled into anything):
- Settings: `marketing_email_mode = 'test'`, `marketing_test_recipients = ''`.
- 5 example templates (`welcome_intro`, `producer_tip_1`, `freebie_delivery`, `freebie_offer`,
  `post_purchase_thanks`).
- 3 example journeys, all `status = 'draft'`: "Welcome sekvence" (`subscriber_created`), "Free 808 Kit
  následná sekvence" (`freebie_downloaded`, includes a `has_purchased` condition that skips the sales
  offer for existing buyers), "Po nákupu (draft)" (`order_completed`).

---

## 3. New API Routes

**Public** (rate-limited):
- `POST /api/leads` — unchanged contract, now also accepts `marketingConsent` and fires the freebie hook.
- `GET /api/marketing/unsubscribe/verify?token=...`
- `POST /api/marketing/unsubscribe` — body `{ token }`
- `POST /api/webhooks/resend` — Svix-signature-verified, mounted with raw body parsing.

**Admin** (all behind `requireAdmin`):
- `GET /api/marketing/overview`
- `GET /api/marketing/subscribers`, `GET /api/marketing/subscribers/:id`
- `POST/DELETE /api/marketing/subscribers/:id/tags[/:tag]`
- `POST /api/marketing/subscribers/:id/unsubscribe|resubscribe|enroll`
- `GET /api/marketing/tags`
- `GET/POST/PATCH/DELETE /api/marketing/templates[/:id]`
- `GET/POST/PATCH/DELETE /api/marketing/journeys[/:id]`
- `POST/PATCH/DELETE /api/marketing/journeys/:id/steps[/:stepId]`
- `POST /api/marketing/enrollments/:id/pause|resume|cancel`
- `GET/POST /api/marketing/settings` (test/production mode)
- `GET/POST /api/marketing/campaigns`, `GET /api/marketing/campaigns/:id/audience-count`,
  `POST /api/marketing/campaigns/:id/send|cancel`

Modified existing routes (contract-compatible, only additive body fields):
- `POST /api/orders/:id/claim-free` — now accepts optional `marketingConsent` in the body.

---

## 4. New Frontend Pages/Components

- `/odhlasit-marketing` (public unsubscribe page, registered in `App.tsx`).
- Admin → Marketing: **Přehled**, **Odběratelé**, **Journeys**, **Kampaně**, **Šablony** sub-tabs.
- Admin → Nastavení: **Marketing e-maily** sub-tab (test/production mode + test recipients).
- Checkout free-download form: new marketing-consent checkbox (unchecked by default — explicit opt-in
  per spec §6, not a pre-ticked box).

---

## 5. New Environment Variables

- `RESEND_WEBHOOK_SECRET` — **required** for the webhook to process anything (fails closed/rejects with
  503 if unset — never silently accepts unverified requests).
- `RESEND_API_KEY` / `RESEND_FROM` — already existed in practice (used by `email.ts`) but were not
  previously documented in `.env.example`; now documented for completeness.
- No other new environment variables. `marketing_email_mode` / `marketing_test_recipients` are
  **database settings**, editable live from the admin UI — not environment variables — so they can be
  changed without a redeploy.

---

## 6. Scheduler Implementation

A `setInterval` tick every 2 minutes, started in `startServer()` in `index.ts` immediately alongside the
two pre-existing background jobs (`sendOverdueBankTransferReminders`, `sendAbandonedCheckoutReminders`).
This was a deliberate architectural decision from the Phase 1 audit: the production deployment is a
single persistent Docker process (confirmed via `Dockerfile` + `docker-compose.yml`), not serverless, so
introducing Redis/BullMQ/cron would have been unjustified complexity. Concurrency safety (in case of a
future multi-replica deployment) is handled by a Postgres advisory lock around the whole tick, plus
`FOR UPDATE SKIP LOCKED` on the due-enrollments query as a second, independent safeguard.

---

## 7. Resend Webhook Configuration (for the operator)

1. In the Resend dashboard, create a webhook endpoint pointing at:
   `https://voodoo808.com/api/webhooks/resend`
2. Enable events: `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`,
   `email.complained`, `email.opened`, `email.clicked`, `email.failed`.
3. Copy the signing secret into `RESEND_WEBHOOK_SECRET` on the server and redeploy.
4. Until this is configured, the webhook route responds `503` to everything — it fails closed, not open.

---

## 8. Manual QA / Review Performed

Because this execution environment has no `node`/`npm` binary (confirmed during the Phase 1 audit — `npm
run build`, `tsc --noEmit`, and any test runner are unavailable here), the following substitute review was
performed instead, on every file created or touched:

- **Brace/paren balance check** across all 17 touched/created files — all balanced. (3 pre-existing
  imbalances were found in unrelated files — `Payment.tsx`, `Checkout.tsx`, `FAQ.tsx` — confirmed via `git
  show HEAD` to already exist before this session's changes; not introduced by this work.)
- **Manual trace of all 6 call sites** where a freebie/purchase/signup event can occur, confirming each
  now calls the appropriate hook: `leads.ts` POST, `orders.ts` `claim-free`, `orders.ts` `check-payment`,
  `orders.ts` admin status PUT, `index.ts` GoPay IPN handler, `auth.ts` register, `index.ts` Google OAuth.
- **Idempotency review**: found and fixed a bug where the `ON CONFLICT (idempotency_key) DO UPDATE SET
  updated_at = ...` clause referenced a non-existent column (`marketing_email_sends` has no `updated_at`
  column) — this would have thrown a Postgres error on every retried send. Fixed to
  `DO UPDATE SET status = 'queued', error = NULL`.
- **Literal-string-color bug review**: the existing codebase has a widespread pre-existing pattern of
  writing colors as literal strings (e.g. `color: "DESIGN_SYSTEM.colors.textPrimary"` instead of
  `color: DESIGN_SYSTEM.colors.textPrimary`), which silently renders as invalid CSS. Scanned and fixed all
  17 occurrences introduced by the new Marketing admin components; pre-existing occurrences elsewhere in
  `Admin.tsx` were left untouched (out of scope for this task).
- **Consent-default review**: confirmed `marketing_consent` defaults to `FALSE` in the schema, the
  Checkout consent checkbox defaults unchecked, and Google-OAuth/register signups never pass
  `marketingConsent: true` — no path in this implementation auto-opts anyone into marketing.
- **Webhook fail-closed review**: confirmed `RESEND_WEBHOOK_SECRET` unset → `503`, missing Svix headers →
  `400`, bad signature → `401`. No code path trusts an unverified POST body.
- **Duplicate-send review**: confirmed the idempotency key is deterministic
  (`journey/{enrollmentId}/step/{stepId}` / `campaign/{campaignId}/subscriber/{subscriberId}`), never a
  random UUID, and is passed to Resend's own idempotency option as well as used as the DB unique key —
  two independent layers of duplicate-send protection.

---

## 9. Known Limitations

1. **No automated test/build run.** This sandbox has no Node.js runtime. Before deploying, run:
   ```
   npm ci
   npm run build          # vite build + esbuild — must pass with zero TypeScript errors
   ```
   and smoke-test: new lead → subscriber created → (with consent checked) enrolled in the Free 808 Kit
   journey once it's activated; a completed order → buyer tag applied; the webhook endpoint with a
   Resend-signed test event; the `/odhlasit-marketing` page end-to-end.
2. **`svix` is a transitive dependency**, not a direct one in `package.json` — it resolves today because
   `resend@6.10.0` depends on it and it's present in `package-lock.json`. If a future `resend` upgrade
   drops or changes this transitive dependency, the webhook route's `await import("svix")` would start
   failing. Recommended next step: add `"svix": "1.88.0"` as an explicit direct dependency the next time
   someone runs `npm install` with real tooling available (not done here to avoid hand-editing
   `package-lock.json` without npm, per this project's strict lockfile-integrity rule).
3. **Campaigns V1 has one implicit segment** ("all active marketing subscribers") rather than the full
   saved-segment builder described in the spec's later bonus sections — this matches the instruction to
   build a reliable V1 first and avoid a complex query-builder UI prematurely.
4. **A/B testing, lead scoring, engagement scoring, product recommendation blocks, and the other "Bonus"
   items (§87)** were intentionally not built — the spec explicitly says to build these only after the
   core system is proven reliable.
5. **GDPR/legal review (§20 Bonus)** was not performed — flagged per the spec's own instruction not to
   invent legal conclusions. A Czech/EU privacy professional should review the new consent flow,
   retention of `marketing_email_events.payload` (raw webhook JSON), and the unsubscribe mechanism before
   this is used at scale.

---

## 10. Recommended Next Steps

1. Run `npm run build` and fix any TypeScript errors surfaced (none anticipated based on manual review,
   but this is unverified without a real compiler run).
2. Configure `RESEND_WEBHOOK_SECRET` in production and register the webhook URL in the Resend dashboard.
3. Add real test recipient(s) to `marketing_test_recipients` in Admin → Nastavení → Marketing e-maily and
   send a manual test enrollment before ever flipping to `production` mode.
4. Review and activate the 3 seeded example journeys one at a time, watching `marketing_email_sends` /
   `marketing_email_events` after each.
5. Consider promoting `svix` to a direct `package.json` dependency (see Limitation #2).
6. Schedule the GDPR/privacy review mentioned above before enabling production sends to real customers.
