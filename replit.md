# VOODOO808 – Digital Music Marketplace

## Project Overview
A full-stack e-commerce platform for music producers to buy beats and sound kits. Built with React + Express + PostgreSQL.

## Architecture

### Frontend (`/client`)
- React 18 with Vite
- Routing via `wouter`
- Pages: Home, Beats (Beaty), Sounds (Zvuky), Admin, Checkout
- Global music player with waveform visualization

### Backend (`/server/src`)
- Express.js REST API
- Authentication: Passport.js (local + Google OAuth 2.0)
- Session: `cookie-session`
- Database: PostgreSQL via `pg` pool + raw SQL (no ORM at runtime)
- Storage: Backblaze B2 (audio/artwork files) + AWS S3
- Audio processing: `ffmpeg-static` for waveform generation
- Email: `nodemailer` + `resend`
- Payments: `gopay-nodejs`

### Shared (`/shared`)
- TypeScript types shared between client and server

## Key Scripts
- `npm run dev` — starts the Express server (which also starts Vite in middleware mode for HMR)
- `npm run build` — builds Vite frontend + compiles server TypeScript
- `npm start` — runs the compiled production server

## Database
- Replit PostgreSQL (DATABASE_URL env var auto-set)
- Schema is auto-created on startup via `initDatabase()` in `server/src/db.ts`
- No Drizzle schema file — schema is managed with raw SQL migrations inside `db.ts`

## Environment Variables Required
- `DATABASE_URL` — auto-set by Replit DB
- `SESSION_SECRET` — session signing secret
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `B2_APPLICATION_KEY_ID` / `B2_APPLICATION_KEY` / `B2_ENDPOINT` / `B2_PUBLIC_BASE_URL` — Backblaze B2 storage
- `STORAGE_BUCKETS_PREVIEWS` / `STORAGE_BUCKETS_FILES` — bucket names
- `GOPAY_*` — GoPay payment gateway credentials
- `RESEND_API_KEY` — email sending
- `APP_URL` — production URL for OAuth callbacks

## Port
- Dev & prod: **5000**

## Replit Migration Notes
- Changed `dev` script from `npx tsx` to `node_modules/.bin/tsx` to avoid interactive prompts
- Replit PostgreSQL provisioned and connected via DATABASE_URL
