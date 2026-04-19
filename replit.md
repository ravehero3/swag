# VOODOO808 - Beat Store

A full-stack e-commerce platform for music producers to sell beats and sound kits.

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Wouter (routing), Lucide-React (icons)
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Replit built-in), raw SQL via `pg` pool
- **Auth**: Passport.js with Google OAuth 2.0 + bcrypt for local auth
- **Storage**: Backblaze B2 (S3-compatible) for audio files and artwork
- **Email**: Resend API for transactional emails
- **Payments**: GoPay integration

## Project Structure

```
client/          # React frontend (Vite-powered)
  src/
    components/  # UI components (AudioPlayer, modals, etc.)
    pages/       # Page-level components (Home, Admin, Checkout, etc.)
server/          # Express backend
  src/
    routes/      # API endpoints (auth, beats, orders, soundKits, etc.)
    middleware/  # Authentication middleware
    lib/         # Utilities (storage/S3, waveform generation)
    db.ts        # Database connection & schema initialization
    index.ts     # Main server entry point
shared/          # Shared TypeScript types (client + server)
public/          # Static assets (cursors, uploaded artwork, videos)
```

## Running the App

- **Development**: `npm run dev` — starts Express with Vite middleware (HMR)
- **Build**: `npm run build` — compiles frontend to `dist/public`, backend to `dist/server`
- **Production**: `npm start` — runs compiled `dist/server/index.js`

The app listens on port **5000**.

## Database

Uses Replit's built-in PostgreSQL. The schema is auto-initialized on startup via `server/src/db.ts`.

Key tables: `users`, `beats`, `sound_kits`, `orders`, `order_items`, `licenses`, `beat_comments`, `promo_codes`, `assets`, `settings`, `email_templates`.

## Environment Variables

Required secrets (set in Replit Secrets):
- `DATABASE_URL` — auto-set by Replit DB
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — for Google OAuth
- `B2_KEY_ID` / `B2_APPLICATION_KEY` — Backblaze B2 credentials
- `SESSION_SECRET` — cookie session secret
- `RESEND_API_KEY` — for transactional emails

Non-secret env vars are in `.replit` under `[userenv.shared]`:
- `B2_ENDPOINT`, `B2_PREVIEW_BUCKET`, `B2_ZIP_BUCKET`, `B2_PUBLIC_BASE_URL`, `RESEND_FROM`

## Admin Access

Default admin account created on first startup:
- Email: `admin@voodoo808.com`
- Password: seeded by `server/src/index.ts`

## Deployment

Configured for Replit Autoscale deployment:
- Build: `npm run build`
- Run: `npm start`

## Migration Status

Imported from Replit Agent and configured for Replit with Node.js 20, PostgreSQL 16, a webview workflow on port 5000, and Replit Autoscale publishing settings. The app initializes its database on startup and serves the React frontend through the Express server.

## Audio Preview UX

The app has a fully persistent global audio player that survives page navigation:

- **Single `<audio>` element** lives in `App.tsx` (the `previewAudioRef`). No page-level audio elements should exist.
- **Global `MusicPlayer` bar** is rendered once in `App.tsx` outside of all routes — it stays mounted across all navigation.
- **`previewPlayer` context** (exposed via `useApp()`) provides: `currentItem`, `isPlaying`, `isLooping`, `isShuffling`, `playPreview`, `handlePlayPause`, `handlePrevious`, `handleNext`, `handleToggleLoop`, `handleToggleShuffle`, `audioRef`, and `setPreviewMeta`.
- **`setPreviewMeta(isSaved, onToggleSave)`** lets page-specific components (e.g. Home.tsx) inject save state and the save/unsave callback into the global player bar without coupling the player to a specific page.
- Home.tsx no longer has a local `<audio>` or `<MusicPlayer>`. It calls `previewPlayer.playPreview()` and syncs `currentBeat` with `previewPlayer.currentItem` via `useEffect`.
- Beaty.tsx still has its own local player (can be migrated similarly in a future pass).
- The `onBuyClick` handler in the global player navigates to the beat product detail page for beats, and adds to cart for sound kits.
