---
name: VOODOO808 project rules
description: Critical constraints and gotchas for the VOODOO808 Czech beatstore project
---

# VOODOO808 Critical Rules

## Tech Stack (DO NOT CHANGE)
- Frontend: React 18, Vite, Wouter, Lucide React
- Backend: Express 4, TypeScript, tsx
- Database: PostgreSQL via raw `pg` pool — Drizzle ORM is ONLY for drizzle-kit migrations, NOT runtime
- Auth: Passport.js (local + Google OAuth 2.0) + cookie-session
- Payments: GoPay (Czech gateway)
- Storage: Cloudflare R2 (primary) + Backblaze B2 (fallback) — both via @aws-sdk/client-s3
- Email: Resend only (no nodemailer)
- PDF: PDFKit

## CRITICAL DEPLOYMENT GOTCHA — package-lock.json
After ANY `npm install` or `npm uninstall` on Replit, the package-lock.json gets rewritten with internal Replit mirror URLs (`http://package-firewall.replit.local/npm/...`). These break Docker/CI builds on Oracle Cloud VPS.

**ALWAYS run immediately after any npm install:**
```bash
sed -i 's|http://package-firewall.replit.local/npm/|https://registry.npmjs.org/|g' package-lock.json
```
**Verify with:** `grep -c "package-firewall.replit.local" package-lock.json` (must return 0)

## Rules
1. NEVER switch from raw pg/SQL to Prisma or use Drizzle ORM at runtime
2. NEVER upgrade React to version 19
3. NEVER change the Express server structure or port (defaults to 5000)
4. NEVER modify package.json scripts without asking
5. NEVER delete or rename existing API routes
6. All user-facing text must be in CZECH language
7. When editing CSS/styles, preserve the existing dark theme design
8. Don't import from @prisma/client, use Next.js patterns, add nodemailer, use backblaze-b2 npm package, or add connect-pg-simple

## Deployment
- Live site: Oracle Cloud via Docker + Docker Hub
- GitHub Actions builds image on push to main
- Dockerfile: node:20, npm ci, builds frontend (Vite) + server (esbuild via build-server.mjs) into dist/
- Dev server: `npm run dev` (tsx server/src/index.ts — Vite in middleware mode for HMR)

**Why:** Breaking any of these causes Docker builds to fail and takes the live site (voodoo808.com) down.

**How to apply:** Check this before any dependency change, tech swap, or framework upgrade.

## Pre-existing TS errors (not caused by agent edits)
`npx tsc --noEmit` on `client/src/pages/Admin.tsx` and `App.tsx` reports 3 baseline errors (missing `NastaveniTab`, missing `IGWaveformPreview`, `PreviewPlayerItem`/`Beat` bpm mismatch). Confirmed via `git stash` that these exist on `main` already — not regressions.

**Why:** Avoids wrongly attributing pre-existing dead code/type errors to new changes; confirm with `git stash` before treating a tsc error as a regression.

## Local artwork gallery (kit-artworks) is generic, not kit-only
`/api/kit-artworks` + `public/kit-artworks` (in `server/src/routes/kitArtworks.ts`) is a generic local image gallery (no Backblaze/R2 bandwidth) originally built for sound-kit artwork. It was extended to Beats artwork too — both tabs in `client/src/pages/Admin.tsx` now have their own copy of the gallery modal/state (`showGallery`, `openGallery`, `loadGallery`, `handleGalleryUpload/Delete/Select`) pointed at the same endpoints.

**Why:** Beats previously uploaded artwork straight to R2/B2 via `/api/upload?type=artwork`; user wanted the same "pick from local gallery" UX as kits, without Backblaze involvement.

**How to apply:** If asked to touch artwork upload UX for beats or kits, know the gallery logic is duplicated per-tab (not shared into one component) — update both places if changing shared behavior.

## Waveform generation is client-side only, needs an open Admin tab
`computeWaveformInBrowser` in `client/src/pages/Admin.tsx` runs entirely in the admin's browser (Web Audio API), not on the server — a deliberate choice per replit.md ("Vercel serverless has no ffmpeg"). It only auto-triggers via `pendingAutoCompute` after the bulk drag-and-drop create flow (`handleBulkCreate`); the single-beat form (`handleSubmit`) was fixed to also set `pendingAutoCompute` so normal beat creation doesn't leave waveforms stuck showing "Výpočet" forever.

**Why:** Explains reports like "uploaded beats but the waveform never finishes" — it's not a bug in computation, it's that nothing ever started the computation (admin used the single-add form, not bulk upload) or the tab was closed before the client-side job finished.

**How to apply:** Any future "waveform stuck/never computes" report should first check whether the creation path that produced the beat sets `pendingAutoCompute(true)`, and whether the admin kept the tab open long enough.
