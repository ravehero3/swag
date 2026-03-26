# ⚡ Quick Reference Checklist

## Pre-Launch Checklist

### Backblaze B2 Setup
- [ ] Go to https://secure.backblaze.com
- [ ] Check `beats-zips` bucket: Bucket Type = PUBLIC
- [ ] Check `beats-previews` bucket: Bucket Type = PUBLIC
- [ ] Note down: Key ID, Key Secret (for Vercel)
- [ ] Note down: Endpoint = s3.eu-central-003.backblazeb2.com

### Vercel Configuration
- [ ] Go to https://vercel.com/dashboard
- [ ] Settings → Environment Variables
- [ ] Add/update all required variables:
  - [ ] DATABASE_URL
  - [ ] B2_KEY_ID
  - [ ] B2_KEY_SECRET
  - [ ] B2_ZIP_BUCKET = beats-zips
  - [ ] B2_PREVIEW_BUCKET = beats-previews
  - [ ] B2_ENDPOINT = s3.eu-central-003.backblazeb2.com
  - [ ] APP_URL = https://voodoo808com-alpha.vercel.app
  - [ ] NODE_ENV = production
  - [ ] SESSION_SECRET = [existing value]
  - [ ] GOOGLE_CLIENT_ID = [existing value]
  - [ ] GOOGLE_CLIENT_SECRET = [existing value]

### Code Deployment
- [ ] Code changes reviewed
- [ ] Commit: `git add -A && git commit -m "fix: Server-side file uploads"`
- [ ] Push: `git push origin main`
- [ ] Wait for Vercel build to complete (check dashboard)
- [ ] Test: Visit https://voodoo808com-alpha.vercel.app

### Testing
- [ ] Login as admin
- [ ] Upload test ZIP file to Beat
- [ ] See "✓ Nahráno" success message
- [ ] Check Backblaze: file appears in beats-zips bucket
- [ ] Upload test ZIP file to Sound Kit
- [ ] Same success as above

### Product Setup
- [ ] Create 1-2 test products
- [ ] Publish them
- [ ] Test customer flow: Browse → Add to cart → Checkout

### Go-Live
- [ ] All checklist items complete ✓
- [ ] Test uploads working ✓
- [ ] Customer flow tested ✓
- [ ] Documentation reviewed ✓
- [ ] Ready to accept real products!

---

## Troubleshooting Quick Reference

### Problem: Upload Shows "Upload se nezdařil"
**Solution**: 
1. Check browser console for errors (F12 → Console tab)
2. Check Vercel logs: `vercel logs --tail`
3. Verify Backblaze buckets are PUBLIC
4. See UPLOAD_TROUBLESHOOTING.md for detailed steps

### Problem: Upload Appears to Work But File Not in Backblaze
**Solution**:
1. Wait 10 seconds (might still be uploading)
2. Refresh Backblaze console
3. Check correct bucket was used (beats-zips for ZIPs)
4. Verify Backblaze credentials in Vercel

### Problem: "Admin přístup vyžadován" Even When Admin
**Solution**:
1. Clear browser cookies
2. Log out and back in
3. Check user is marked as admin in database
4. Contact database team to verify: SELECT is_admin FROM users WHERE email = 'your@email.com';

### Problem: Can't Login
**Solution**:
1. Check DATABASE_URL is correct in Vercel
2. Verify Supabase project hasn't hit resource limits
3. Try registering a new account
4. Check Vercel logs for database errors

---

## Key Commands

### Local Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5000)
npm run build        # Build for production
```

### Deployment
```bash
git push origin main # Deploy to Vercel
vercel logs --tail   # Watch production logs
vercel env pull      # Get environment variables locally
```

### Database
```bash
npm run seed-admin   # Create/reset admin user
```

---

## Important URLs

- **Site**: https://voodoo808com-alpha.vercel.app
- **Admin Panel**: https://voodoo808com-alpha.vercel.app/admin
- **Backblaze Console**: https://secure.backblaze.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Database**: Supabase (credentials in DATABASE_URL)

---

## Contact Info

**Backblaze Support**: https://www.backblaze.com/b2/help/
**Vercel Support**: https://vercel.com/help/
**Supabase Support**: https://supabase.com/docs/

---

## Estimated Time

- **Verify Backblaze**: 5 minutes
- **Deploy Code**: 10 minutes (wait for Vercel build)
- **Test Uploads**: 10 minutes
- **Create Test Products**: 10 minutes
- **Full Testing**: 15 minutes

**Total**: ~50 minutes to launch ✅

---

**Everything is ready! You can go live! 🚀**
