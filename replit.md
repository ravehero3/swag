# VOODOO808.COM - Digital Music Shop

## Recent Changes (December 28, 2025)
- Migrated from Supabase to Replit's built-in PostgreSQL database
- Database tables are initialized automatically on server start
- Using pg library directly for database operations (no Supabase client)

## Overview
E-commerce website for selling beats and drum kits to music producers. The site features:
- **BEATY page**: Beat player with playlist, preview functionality, and purchasing
- **ZVUKY page**: Sound kits/drum kits grid with preview audio, artwork, and downloads
- **User authentication**: Login/register system for customers
- **Admin panel**: Upload and manage products, artwork, preview audio, ZIP files
- **Shopping cart**: Add items and checkout
- **Order management**: Email delivery of digital files after purchase

## Tech Stack
- **Frontend**: React with TypeScript, Vite, Wouter (routing)
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon-backed via Replit)
- **File uploads**: Multer for handling audio/zip/image uploads
- **Styling**: Custom CSS (black & white theme, Helvetica Neue font)

## Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Header, UI components
│   │   ├── pages/         # Beaty, Zvuky, Login, Cart, Checkout, Admin
│   │   └── styles/        # Global CSS
│   └── index.html
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/        # API routes (auth, beats, soundKits, orders, upload)
│   │   ├── middleware/    # Auth middleware
│   │   └── db.ts          # Database connection and schema
├── shared/                 # Shared TypeScript types
├── public/uploads/         # Uploaded files (beats, kits, artwork, previews)
└── attached_assets/        # Logo files
```

## Running the Project
```bash
npm run dev
```
Server runs on port 5000 with Vite dev server middleware.

## Database Tables
- `users`: User accounts with email/password auth
- `beats`: Beat products (title, artist, bpm, key, price, files)
- `sound_kits`: Sound kit products (drum kits, one shots, loops, etc.)
- `orders`: Customer orders with items and status
- `session`: Express session storage

## Admin Access
To create an admin user, update a user's `is_admin` column to `true` in the database:
```sql
UPDATE users SET is_admin = true WHERE email = 'admin@example.com';
```

## User Preferences
- Language: Czech (cs)
- Design: Black & white minimalist theme
- Font: Helvetica Neue
- All elements have fade-in animations (0 to 100 opacity)
- Input fields have 1px white stroke on black background
