# VOODOO808 – Czech Beat Store

## Project Overview
VOODOO808 (voodoo808.com) is a Czech-language beat store where producers buy and download beats and sound kits. Full-stack e-commerce platform with React + Express + PostgreSQL.

## Tech Stack — DO NOT CHANGE OR UPGRADE
- **Frontend:** React 18, Vite, Wouter (routing), Lucide React (icons)
- **Backend:** Express 4 (Node.js), TypeScript, tsx
- **Database:** PostgreSQL with raw SQL via pg pool (Drizzle ORM only for drizzle-kit migrations, NOT runtime)
- **Auth:** Passport.js with local (email/password) + Google OAuth 2.0, cookie-session
- **Payments:** GoPay (Czech payment gateway)
- **File storage:** Cloudflare R2 (primary) + Backblaze B2 (fallback), both via @aws-sdk/client-s3
- **Image processing:** Sharp
- **Audio processing:** ffmpeg-static (waveform generation)
- **Email:** Resend
- **PDF generation:** PDFKit

## File Structure
- Frontend: `client/src/` (React components, pages, hooks)
- Backend: `server/src/` (Express routes, middleware, db, email)
- Routes: `server/src/routes/` (auth, beats, soundKits, orders, upload, saved, licenses, adminLicenses, leads, comments, kitArtworks)
- Lib: `server/src/lib/` (storage, waveform, gopay, pricing, contracts, contractPdf, contractTemplate, appUrl)
- Build output: `dist/`

## Key Scripts
- `npm run dev` — runs tsx server/src/index.ts (Vite runs in middleware mode for HMR)
- `npm run build` — vite build && node build-server.mjs
- `npm start` — node dist/index.cjs
- `npm run db:push` — drizzle-kit push
- Server listens on PORT env var, defaults to 5000

## Database
- Replit PostgreSQL (DATABASE_URL auto-set by Replit)
- Schema is auto-created on startup via `initDatabase()` in `server/src/db.ts`
- NO Drizzle at runtime — schema managed with raw SQL inside db.ts

## Beat Storage — VPS Local Mode
Set `BEAT_STORAGE=local` in the server environment to save bulk-uploaded beat preview files directly to `public/uploads/beats/` on the VPS filesystem instead of uploading to R2/B2. The returned URL uses `APP_URL` as the base so waveform generation gets a fully-qualified public URL.

**VPS docker-compose.yml** must have this volume under the `beatz` service for files to survive redeploys:
```yaml
volumes:
  - ./data/beats:/app/public/uploads/beats
```
The `./data/beats` directory on the VPS host holds all uploaded beat files permanently.

## Environment Variables Required
- `DATABASE_URL` — auto-set by Replit PostgreSQL
- `SESSION_SECRET` — session signing secret
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` / `R2_PUBLIC_BASE_URL` — Cloudflare R2 (primary storage)
- `B2_ENDPOINT` / `B2_KEY_ID` / `B2_APPLICATION_KEY` / `B2_PREVIEW_BUCKET` / `B2_PUBLIC_BASE_URL` — Backblaze B2 (fallback)
- `RESEND_API_KEY` / `RESEND_FROM` — email
- `GOPAY_CLIENT_ID` / `GOPAY_CLIENT_SECRET` / `GOPAY_GOID` / `GOPAY_SANDBOX` — payments
- `APP_URL` — production domain (for OAuth callbacks and GoPay return URLs)

## Critical Rules
1. NEVER switch from raw pg/SQL to Prisma or use Drizzle ORM at runtime
2. NEVER upgrade React to version 19 — stay on React 18
3. NEVER change the Express server structure or port
4. NEVER modify package.json scripts without asking
5. NEVER delete or rename existing API routes
6. All user-facing text must be in CZECH language
7. Preserve existing dark theme design
8. Build command bundles both frontend (Vite) AND backend (esbuild via build-server.mjs)

## ⚠️ CRITICAL: After any npm install/uninstall
npm rewrites package-lock.json with Replit mirror URLs that break Docker CI. Always run:
```
sed -i 's|http://package-firewall.replit.local/npm/|https://registry.npmjs.org/|g' package-lock.json
grep -c "package-firewall.replit.local" package-lock.json  # must return 0
```

## Deployment
- Live site: Oracle Cloud via Docker
- GitHub Actions (.github/workflows/main.yml) builds Docker image on push to main
- Dockerfile uses node:20, runs npm ci, builds frontend + server

## User Preferences
- All user-facing text must be in Czech language
- Never propose migrating to Prisma, Drizzle (at runtime), or Next.js
- Never add nodemailer (use Resend only), connect-pg-simple (use cookie-session only), or backblaze-b2 npm package (use @aws-sdk/client-s3)
