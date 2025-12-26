# VOODOO808 Shop - Vercel Deployment Guide

## Prerequisites

1. **PostgreSQL Database**: You'll need a PostgreSQL database. Recommended options:
   - Neon (free tier available)
   - Supabase
   - AWS RDS
   - Railway

2. **Environment Variables Required**:
   - `DATABASE_URL`: PostgreSQL connection string
   - `SESSION_SECRET`: A secure random string for session encryption

## Deployment Steps

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **Create Vercel Project**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure Environment Variables**:
   - In Vercel Project Settings → Environment Variables
   - Add the following variables:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `SESSION_SECRET`: Generate a secure random string (use `openssl rand -base64 32`)

4. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically build and deploy

## Important Notes

- The `DATABASE_URL` must be a valid PostgreSQL connection string
- The `SESSION_SECRET` should be a secure random string, unique per environment
- The build process will:
  1. Compile TypeScript (frontend and backend)
  2. Build the Vite frontend
  3. Compile the server code
- The server runs on port 5000 and serves both the API and static frontend files

## Database Setup

The application will automatically create all required tables on first run. Make sure your PostgreSQL database is accessible from Vercel.

## Troubleshooting

- **"Cannot find module"**: Clear build cache in Vercel settings and redeploy
- **"DATABASE_URL is required"**: Ensure the environment variable is set in Vercel
- **Session errors**: Verify `SESSION_SECRET` is set and has sufficient length (minimum 32 characters recommended)
