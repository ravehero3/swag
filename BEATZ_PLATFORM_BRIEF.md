# BEATZ Platform — Agent Briefing

## What You Are Building

A **multi-tenant beat store platform** at `beatpack.voodoo808.com`.

Each user who signs up gets their own beat store — a fully working music shop with the same design, player, and features as voodoo808.com (which this codebase is based on). Users can brand it with their own name, logo, colors, and video. They upload their beats and sound kits, set prices, and sell them to customers.

Think of it like "Shopify for beat producers" — one platform, many independent stores.

---

## Reference Design — voodoo808.com (the "swag" repo)

The entire UI/UX is already built and working at voodoo808.com. You must replicate this design and experience. Do NOT touch the swag repository — it is the live production store and must not be modified.

### Pages in swag (all must be replicated per-store):
- **Home / Beaty page** — beat catalog with waveform players, tag filters, artwork, beat comments, "add to cart" / license selection
- **Zvuky page** — sound kit catalog with preview player, kit cards
- **Checkout page** — cart, payment, buyer info form
- **Payment Status page** — post-payment confirmation
- **Ucet (Account) page** — user login, orders, favorites
- **Admin panel** — store owner dashboard to manage beats, sound kits, orders, licenses, settings, SEO

### Key UI components (all must be replicated):
- **Global music player** (fixed bottom bar) — plays beats/previews, shows waveform, BPM, key, artwork; has play/pause, skip, shuffle, loop, volume, save, buy button
- **Header** — fixed top bar with logo (customizable per store), navigation links, cart icon with count, favorites icon, account icon
- **Cart modal** — slide-out right panel with items, recently viewed, total, checkout button
- **Contract/License modal** — license tier selector (MP3, WAV, Exclusive, etc.) shown before adding a beat to cart
- **Download modal** — for free downloads, requires login
- **Share modal** — generates shareable links + Instagram Story card with custom branding
- **Hero section** — full-screen video background (store owner uploads their own video), with logo overlay
- **Special offer banner** — optional countdown/discount banner
- **Sound kits dock** — expandable preview player for kit sounds
- **Beat comments** — timestamped comments on waveform

### Design language:
- Dark background (near-black)
- Glassmorphism panels (blurred semi-transparent cards)
- White/grey typography
- Accent color is customizable per store (currently uses a muted purple/grey palette)
- All images/artwork use rounded corners
- Bottom-fixed music player never disappears while browsing

---

## Multi-Tenancy Architecture

### How stores are identified

Each store is identified by a **slug** (e.g., `djtomáš`, `producerxyz`). Stores are accessed via:

- **Option A (recommended):** Path-based — `beatpack.voodoo808.com/store/[slug]`
- **Option B:** Subdomain — `[slug].beatpack.voodoo808.com` (requires wildcard DNS, harder to set up)

Go with **Option A** (path-based) — simpler, no DNS complexity, works immediately.

### Database additions needed

Add these tables on top of the existing swag schema:

```sql
-- A beat store owned by one user
CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id),
  slug VARCHAR(60) UNIQUE NOT NULL,       -- URL-safe identifier
  store_name VARCHAR(255) NOT NULL,
  tagline TEXT,
  logo_url VARCHAR(500),
  hero_video_url VARCHAR(500),
  accent_color VARCHAR(20) DEFAULT '#ffffff',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- All existing beats/sound_kits tables get a store_id column
ALTER TABLE beats ADD COLUMN store_id INTEGER REFERENCES stores(id);
ALTER TABLE sound_kits ADD COLUMN store_id INTEGER REFERENCES stores(id);
ALTER TABLE orders ADD COLUMN store_id INTEGER REFERENCES stores(id);
ALTER TABLE license_types ADD COLUMN store_id INTEGER REFERENCES stores(id);
```

Every beat, sound kit, order, and license type belongs to a specific store.

### User roles

- **Platform user** — signs up, can create one store, becomes that store's owner/admin
- **Customer** — visits a store URL, can browse, buy, leave comments (shared user accounts across all stores OR per-store — your choice, per-store is simpler)

---

## Store Owner Admin Panel

The existing swag Admin panel (Admin.tsx) must be adapted so store owners can manage only THEIR store's content. The admin panel is accessed at `/store/[slug]/admin`.

Admin panel tabs:
1. **Beats** — upload, edit, delete beats (same upload flow as swag)
2. **Zvuky** — upload, edit, delete sound kits
3. **Orders** — view their store's orders
4. **Licenses** — configure license tiers and pricing for their store
5. **Branding** — set store name, tagline, logo, hero video, accent color
6. **SEO** — set page title, description, OG image

---

## File Storage

Reuse the same storage system from swag:

- **Cloudflare R2** — artwork images, beat previews (public CDN)
- **Backblaze B2** — audio previews, ZIP files
- **Local uploads** — fallback

Each store's files are stored under a namespaced key: `stores/[store_slug]/artwork/...`, `stores/[store_slug]/previews/...` etc.

Storage env vars needed (same as swag):
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`
- `B2_ENDPOINT`, `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_PREVIEW_BUCKET`, `B2_PUBLIC_BASE_URL`

---

## Payment System

Each store owner connects their own **GoPay** account. Store settings include:
- `gopay_goid`
- `gopay_client_id`
- `gopay_client_secret`
- `gopay_sandbox` (boolean)

These are stored encrypted in the `stores` table (or a separate `store_payment_config` table).

When a customer buys from a store, the payment goes to that store's GoPay account.

---

## Auth System

Use the same auth as swag:
- Email + password registration/login
- Google OAuth (optional)
- `cookie-session` + `passport.js`
- `bcryptjs` for password hashing

When a user registers, prompt them to create a store (or let them do it later from their account page).

---

## Email

Use **Resend** (same as swag) for:
- Welcome email on registration
- Order confirmation with download links
- License PDF attached to order confirmation

Each store should ideally send from the platform domain (`noreply@beatpack.voodoo808.com`) but mention the store name in the email subject/body.

---

## Key Files to Port from swag

These files contain the core UI that must be replicated (copy and adapt, do not import from swag directly):

| swag file | What it contains |
|---|---|
| `client/src/pages/Home.tsx` | Beat catalog, waveform players, hero section, tag filters |
| `client/src/pages/Zvuky.tsx` | Sound kit catalog |
| `client/src/pages/Admin.tsx` | Full admin dashboard |
| `client/src/pages/Checkout.tsx` | Checkout flow |
| `client/src/pages/PaymentStatus.tsx` | Post-payment page |
| `client/src/components/MusicPlayer.tsx` | Global bottom music player |
| `client/src/components/Header.tsx` | Top navigation bar |
| `client/src/components/CartModal.tsx` | Cart slide-out panel |
| `client/src/components/ContractModal.tsx` | License selector modal |
| `client/src/components/DownloadModal.tsx` | Free download modal |
| `client/src/components/ShareModal.tsx` | Share + Instagram Story modal |
| `client/src/components/SoundWave.tsx` | Waveform visualization |
| `client/src/components/MiniWavePlayer.tsx` | Inline waveform player |
| `client/src/components/ProductCard.tsx` | Beat/kit card |
| `client/src/components/ProductsGrid.tsx` | Grid layout for kits |
| `client/src/components/SoundKitsDock.tsx` | Kit preview dock |
| `client/src/components/SpecialOfferBanner.tsx` | Promo banner |
| `server/src/db.ts` | Full DB schema (adapt for multi-tenancy) |
| `server/src/lib/storage.ts` | File storage abstraction |
| `server/src/lib/gopay.ts` | GoPay payment client |
| `server/src/email.ts` | Email sending logic |
| `server/src/routes/beats.ts` | Beat CRUD API |
| `server/src/routes/soundKits.ts` | Sound kit CRUD API |
| `server/src/routes/orders.ts` | Order + payment API |
| `server/src/routes/upload.ts` | File upload (presigned + server-side) |
| `server/src/routes/auth.ts` | Auth routes |
| `server/src/middleware/auth.ts` | `requireAuth` / `requireAdmin` middleware |
| `server/src/lib/pricing.ts` | Price calculation logic |
| `server/src/lib/contracts.ts` | License PDF generation |
| `server/src/lib/contractTemplate.ts` | Contract text template |

---

## Routing Structure

```
/                          → Platform landing page (explain what beatpack is, CTA to create store)
/register                  → Sign up + create store
/login                     → Log in
/store/[slug]              → Store homepage (Beaty page)
/store/[slug]/zvuky        → Store sound kits page
/store/[slug]/checkout     → Checkout for this store's items
/store/[slug]/platba-status → Payment status
/store/[slug]/ucet         → Customer account
/store/[slug]/admin        → Store owner admin panel (protected)
```

---

## Tech Stack (same as swag)

- **Frontend:** React 18, TypeScript, Vite, Wouter (routing), Lucide React (icons), Tailwind CSS
- **Backend:** Node.js, Express, TypeScript, `tsx` to run in dev
- **Database:** PostgreSQL (`pg` pool, raw SQL — NO Drizzle ORM at runtime, schema in `db.ts`)
- **Session:** `cookie-session` + Passport.js
- **Dev command:** `node_modules/.bin/tsx server/src/index.ts` (NOT `npx tsx` — it prompts interactively)
- **Build:** `vite build && node build-server.mjs` → outputs to `dist/`
- **Production:** `node dist/index.cjs`

---

## Important Constraints

- Do NOT use Prisma or Drizzle at runtime — raw SQL only via `pg` pool
- Do NOT upgrade to React 19
- After every `npm install`, fix `package-lock.json` by running `npm install` once more
- The dev script must use `node_modules/.bin/tsx`, not `npx tsx`
- The Vite server must have `allowedHosts: true` and `host: '0.0.0.0'` for Replit preview to work
- Keep all API routes under `/api/*`
- Frontend uses `wouter` for routing (not React Router)
- Use `@tanstack/react-query` v5 for all data fetching (object form only: `useQuery({ queryKey: [...] })`)

---

## What the Platform Landing Page Should Do

The root `/` page is the marketing page for the platform itself. It should:
- Explain what beatpack.voodoo808.com is ("Create your free beat store in minutes")
- Show a preview/demo of what a store looks like
- Have a "Create your store" CTA → goes to `/register`
- List features: custom branding, beat player, sound kits, GoPay payments, license contracts, email delivery

---

## Summary of What to Build

1. Multi-tenant database schema (stores table + store_id on all content tables)
2. Store creation flow (register → name your store → get your URL)
3. Per-store public pages (Beaty, Zvuky, Checkout, PaymentStatus) — same design as swag
4. Per-store admin panel — store owner manages their own content and branding
5. Platform landing page at `/`
6. All the same modals, music player, header (with per-store logo/branding), cart
7. File uploads namespaced per store
8. GoPay payment configured per store (store owner enters their own credentials in admin)
9. Email notifications on order completion
