# Asset Loading Fixes for Vercel Deployment

## Issues Fixed

### 1. **Development-Only Asset Paths**
**Problem:** The Beaty page used `/attached_assets/ANALOG_7_1767042864282.mov` which only exists during development.
**Fix:** Changed to use `/uploads/artwork/voodoo808-video.mp4` for production consistency.

### 2. **Missing Public Folder Configuration**
**Problem:** Vite was not copying the public folder assets during the build process because the root was set to "client/" but the public folder was at the project root.
**Fix:** Added `publicDir: "../public"` to vite.config.ts so all assets in `/public/` are included in the build.

### 3. **Logo and Video Asset Paths**
**Status:** Paths are correct (`/uploads/artwork/` and `/uploads/hrad-na-web.mov` exist in public folder)
**Server:** Express is already configured to serve static files from `/uploads` properly.

## Changes Made

### vite.config.ts
- Added `publicDir: "../public"` to ensure public folder assets are copied during build
- This tells Vite to copy everything from `/public/` to `/dist/public/` during production build

### client/src/pages/Beaty.tsx
- Removed hardcoded development path `/attached_assets/ANALOG_7_1767042864282.mov`
- Now uses `(settings.beaty_video_main || "/uploads/artwork/voodoo808-video.mp4")` for both homepage and Beaty page

## For Vercel Deployment

### Step 1: Update Your Vercel Build Configuration
In your `vercel.json` (create if doesn't exist):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 2: Ensure Environment Variables
Set in Vercel:
- `DATABASE_URL` - Your production database connection string
- `SESSION_SECRET` - Secure random string for session encryption
- `NODE_ENV` - Set to "production"

### Step 3: Verify Files Are Deployed
After deployment, check that:
- `/uploads/artwork/voodoo808-logo.png` loads correctly
- `/uploads/artwork/voodoo808-video.mp4` loads correctly
- `/uploads/hrad-na-web.mov` loads correctly

### Step 4: Test Videos
Check the following pages after deployment:
- Home page (/) - Should show ANALOG 7 video
- /beaty - Should show Beaty video
- /zvuky - Should show ZVUKY video

## Troubleshooting

If videos still don't load in Vercel:

1. **Check Build Output**: Verify the build includes `/public/uploads/` files
2. **MIME Types**: Ensure your Vercel/server correctly serves `.mov` and `.mp4` files
3. **CORS Issues**: If videos come from CDN, ensure CORS headers are set
4. **Large Files**: If videos are large, you might want to:
   - Use video hosting service (Cloudinary, Bunny CDN)
   - Serve from separate CDN
   - Optimize video compression

## Reference: File Locations

Videos and assets are stored in:
```
public/
├── uploads/
│   ├── artwork/
│   │   ├── voodoo808-logo.png
│   │   ├── voodoo808-video.mp4
│   │   ├── voodoo808-video.mov
│   │   └── [other artwork files]
│   ├── hrad-na-web.mov
│   └── [other upload files]
└── payment-methods.jpg
```

These will be automatically copied to your production build's public directory.
