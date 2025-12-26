# Deploying VOODOO808 Shop to Vercel

## ✅ Setup Complete

Your project is now fully configured for Vercel deployment. The build process has been tested and works correctly.

## 🚀 Quick Start

1. **Ensure you have a PostgreSQL database** (Neon, Supabase, Railway, etc.)

2. **Push to GitHub** (or connect your repo):
   ```bash
   git push origin main
   ```

3. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Skip the environment variables step (they're already configured in Replit)
   - Click "Deploy"

4. **Add Production Environment Variables** (in Vercel Project Settings):
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SESSION_SECRET`: A secure random string (min 32 chars)

## 📁 What Was Configured

✅ **vercel.json** - Vercel deployment configuration
✅ **server/tsconfig.json** - Server TypeScript configuration
✅ **Build scripts** - Proper build pipeline (frontend + backend)
✅ **Environment setup** - All required env vars set up
✅ **Fixed imports** - Removed references to deleted directories
✅ **TypeScript fixes** - Fixed compilation errors

## 🔧 Project Structure for Vercel

```
root/
├── client/          → React frontend
├── server/          → Express backend
├── public/          → Static files & uploads
├── dist/            → Build output
│   ├── public/      → Frontend build (served as static)
│   └── server/      → Backend build (runs as server)
├── vercel.json      → Vercel configuration
└── package.json     → Scripts & dependencies
```

## 📋 Important Notes

- The application runs as a **single Node.js server** that serves both API and frontend
- Uploads directory is served from `public/uploads`
- Database tables are automatically created on first run
- Session store uses PostgreSQL (not in-memory)
- CORS is configured for all origins in development; restricted in production

## 🎯 What Happens on Deploy

1. Vercel runs `npm run build`:
   - Compiles TypeScript (frontend)
   - Builds Vite frontend bundle
   - Compiles TypeScript (server)
2. Vercel runs `npm start`:
   - Starts Node.js server on port 5000
   - Initializes database tables
   - Serves API at `/api/*`
   - Serves frontend assets at `/`

## 🔐 Environment Variables Required

Both must be set in Vercel project settings:

- **DATABASE_URL** (required)
  Example: `postgresql://user:pass@host.neon.tech/dbname`

- **SESSION_SECRET** (required)
  Generate with: `openssl rand -base64 32`

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| Build fails | Check that all dependencies are installed: `npm install` |
| Database connection error | Verify DATABASE_URL is correct and database is accessible |
| Session errors | Ensure SESSION_SECRET is at least 32 characters |
| Uploads not working | Verify `public/uploads` directory exists |

## 📞 Support

If deployment fails:
1. Check Vercel build logs in the project dashboard
2. Verify environment variables are set correctly
3. Ensure database connection string is valid
4. Check that Node.js version is compatible (18+)

---

**Ready to deploy!** Your shop is production-ready. 🎉
