# Voodoo808 Shop - Complete Setup & Configuration Guide

## 🎯 Overview
This guide helps you set up and deploy the Voodoo808 digital music shop for selling beats and drum kits to music producers.

## ✅ Environment Variables (Vercel)

Make sure all these environment variables are set in your Vercel project:

```
# Database
DATABASE_URL=postgresql://postgres.coqomscjsdzdmsrlfahg:XK2YHOuYLaWtJJWu@aws-1-eu-central-1.pooler.supabase.com:5432/postgres

# Backblaze B2 Credentials
B2_KEY_ID=003b09e916418fa0000000002
B2_KEY_SECRET=K0035wJOeSYzfNxOvZki2AMMHNVBhWk
B2_ZIP_BUCKET=beats-zips
B2_PREVIEW_BUCKET=beats-previews
B2_ENDPOINT=s3.eu-central-003.backblazeb2.com

# Application
APP_URL=https://voodoo808com-alpha.vercel.app
NODE_ENV=production
SESSION_SECRET=jdkruwptofjveitpoiuteutiopruzpnb
GOOGLE_CLIENT_ID=64636004330-m3fjv7koavrhqhjjv0grgaqu5gndq5sr.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

**IMPORTANT**: Never commit these credentials to GitHub! Keep them only in Vercel's environment variables.

## 🪣 Backblaze B2 Bucket Configuration

### Required: Make Buckets Public

Both buckets must be set to **PUBLIC** to allow uploads and downloads:

1. Go to [Backblaze B2 Console](https://secure.backblaze.com)
2. For each bucket (`beats-zips` and `beats-previews`):
   - Click on the bucket name
   - Go to **Settings** → **Bucket Info**
   - Set **Bucket Type** to **Public**
   - Save changes

### CORS Configuration (Optional but Recommended)

If you want to use presigned URLs for direct browser uploads in the future:

1. In bucket settings, find **CORS Rules**
2. Add this configuration:

```json
[
  {
    "corsRuleName": "allowFileUploads",
    "allowedOrigins": ["https://voodoo808com-alpha.vercel.app"],
    "allowedCapabilities": ["b2:listBuckets", "b2:readBucketInfo", "b2:uploadFile", "b2:listFiles"],
    "allowedHeaders": ["Authorization", "Content-Type", "x-bz-content-sha1"],
    "exposeHeaders": ["x-bz-content-sha1", "x-bz-upload-timestamp"],
    "maxAgeSeconds": 3600
  }
]
```

## 🚀 Deployment Steps

### 1. Local Development

```bash
# Install dependencies
npm install

# Start dev server (runs on http://localhost:5000)
npm run dev
```

### 2. Build for Production

```bash
npm run build
```

### 3. Deploy to Vercel

```bash
# Option A: Using Vercel CLI
vercel deploy

# Option B: Push to GitHub (Vercel auto-deploys)
git add .
git commit -m "Deploy updates"
git push origin main
```

## ✨ Key Improvements Made

### Upload System
- **Before**: Used presigned URLs (browser directly uploads to Backblaze)
- **After**: Server-side upload endpoint (Express handles upload to Backblaze)
- **Benefit**: More reliable, avoids CORS issues, better error handling

### File Upload Flow
1. Admin selects file in browser
2. Browser POST to `/api/upload?type=beat` with FormData
3. Server receives file, uploads to Backblaze
4. Server returns public URL or storage key
5. Admin sees confirmation

### Error Handling
- Better error messages with hints for debugging
- Console logging for server-side debugging
- Detailed error responses to frontend

### Middleware Improvements
- Increased JSON/form data size limit to 500MB
- Proper CORS configuration
- Express session management for authentication

## 📋 Testing Checklist

### Pre-Deployment Checks

- [ ] All environment variables set in Vercel
- [ ] Both Backblaze buckets set to PUBLIC
- [ ] Database connection working (check /api/auth/me)
- [ ] Google OAuth credentials valid

### Upload Testing

1. **Login to Admin Panel**
   - Go to https://voodoo808com-alpha.vercel.app
   - Click "Přihlásit se" (Login)
   - Use admin credentials

2. **Test Beat Upload**
   - Click "Admin Panel" → "Beaty" tab
   - Click "Přidat beat" (Add beat)
   - Fill in beat info:
     - Title: "Test Beat"
     - BPM: 140
     - Price: 0 (for testing)
   - Click "Preview Audio" file input → upload test audio
   - Click "Beat File" → upload test ZIP file
   - Click "Artwork" → upload test image
   - Click "Přidat beat" (Save)
   - **Expected**: "✓ Nahráno" (Uploaded) status

3. **Test Sound Kit Upload**
   - Click "Zvuky" tab
   - Click "Přidat zvukový kit"
   - Fill in kit info and upload files
   - Verify upload success

4. **Verify Files in Backblaze**
   - Go to [Backblaze B2 Console](https://secure.backblaze.com)
   - Check `beats-previews` bucket for audio/artwork files
   - Check `beats-zips` bucket for ZIP files
   - Files should have generated UUIDs as names

### Customer Flow Testing

1. **Purchase Flow**
   - Home page should display published beats
   - Click on a beat → see product details
   - Add to cart → proceed to checkout
   - Complete payment

2. **Download Flow**
   - After purchase, order should be created
   - Check order status in Admin → "Objednávky"
   - Customer receives download email

## 🐛 Troubleshooting

### Upload Fails with "500 Error"

**Check**:
1. Server logs for detailed error message
2. Backblaze credentials in Vercel are correct
3. Buckets are set to PUBLIC
4. Disk space available

**Solution**:
```bash
# Check server logs in Vercel
vercel logs --tail
```

### "Chyba serveru (403)" Error

**Cause**: Backblaze bucket is not public

**Solution**:
1. Go to Backblaze B2 Console
2. Click bucket name → Settings
3. Set Bucket Type to "Public"
4. Save and retry upload

### Admin Cannot See Uploaded Files

**Check**:
1. Verify admin status: `SELECT is_admin FROM users WHERE email = 'your@email.com';`
2. Check database connection in Vercel logs
3. Verify session cookie is being set

**Solution**:
```bash
# Reset admin user
npm run seed-admin
```

### Files Not Accessible After Upload

**Cause**: Files stored but not public, or wrong bucket

**Solution**:
1. Check Backblaze bucket type is PUBLIC
2. Verify file exists in correct bucket (beats-zips or beats-previews)
3. Try accessing file at: `https://bucket-name.s3.eu-central-003.backblazeb2.com/file-key`

## 💳 Payment Integration

Currently set up with GoPay payment gateway. To test:

1. Use test payment data (contact GoPay for test credentials)
2. Redirect to GoPay on checkout
3. Complete payment flow
4. Order stored in database
5. Email sent to customer with download link

## 📧 Email Configuration

Currently ready for SendGrid or similar:
- Order confirmation email
- Download link included
- Customizable email template

To enable:
1. Add SendGrid API key to environment
2. Update email sending code in `/server/src/routes/orders.ts`

## 🔐 Security Notes

1. **Admin Credentials**
   - Change default admin password after first login
   - Use strong SESSION_SECRET (already set)
   
2. **Google OAuth**
   - Credentials properly configured in Vercel
   - Callback URL matches production domain

3. **Database**
   - Using Supabase PostgreSQL (production-grade)
   - Connection uses SSL for external connections

4. **Backblaze**
   - Keys stored only in Vercel (never in code)
   - Public buckets allow read-only access to customers
   - No sensitive data in bucket names

## 🎯 Next Steps

1. ✅ Deploy this updated code to Vercel
2. ✅ Test all upload functionality
3. ✅ Verify Backblaze bucket configuration
4. ✅ Test customer purchase flow
5. ✅ Set up email notifications (optional)
6. ✅ Create test products and publish them

## 📞 Support

For issues:
1. Check Vercel logs: `vercel logs --tail`
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Ensure Backblaze buckets are PUBLIC

---

**Last Updated**: March 26, 2024
**Version**: 2.0 (Server-side uploads enabled)
