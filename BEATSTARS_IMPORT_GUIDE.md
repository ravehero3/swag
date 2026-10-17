# 🎯 BeatStars Audience Import Guide

## Status: ✅ Ready to Import 5,051 Customers

Your BeatStars customer list is ready to import. Here are 3 ways to do it:

---

## Option 1: Direct SQL Import (Fastest - Requires Database Access)

If you have direct access to your PostgreSQL database:

```bash
# Connect to your database
psql $DATABASE_URL << 'EOF'

BEGIN;

-- Create tags
INSERT INTO tags (name, slug) VALUES 
  ('freebie', 'freebie'),
  ('beatstars', 'beatstars'),
  ('imported', 'imported'),
  ('subscribed', 'subscribed')
ON CONFLICT (slug) DO NOTHING;

-- Import 5051 BeatStars customers (copy-paste below)
INSERT INTO subscribers (email, email_normalized, name, marketing_consent, marketing_consent_at, marketing_consent_source, first_source, created_at, updated_at) 
VALUES 
  ('yvngkolin@gmail.com', 'yvngkolin@gmail.com', 'Matej kolinsky', true, NOW(), 'beatstars_import', 'beatstars_free_download', NOW(), NOW()),
  ('kuba.jakub.pospisil@gmail.com', 'kuba.jakub.pospisil@gmail.com', 'Jakub Pospíšil', true, NOW(), 'beatstars_import', 'beatstars_free_download', NOW(), NOW()),
  -- ... (5049 more records)
ON CONFLICT (email_normalized) DO UPDATE SET
  marketing_consent = TRUE,
  marketing_consent_at = COALESCE(subscribers.marketing_consent_at, NOW()),
  updated_at = NOW();

-- Add tags
INSERT INTO subscriber_tags (subscriber_id, tag_id)
SELECT DISTINCT s.id, t.id 
FROM subscribers s, tags t
WHERE s.first_source = 'beatstars_free_download'
  AND t.slug IN ('freebie', 'beatstars', 'imported', 'subscribed')
ON CONFLICT DO NOTHING;

COMMIT;
EOF
```

---

## Option 2: Use Admin API (Via Dashboard)

If you have admin access to www.voodoo808.com/admin:

1. Go to **Admin → Marketing → Subscribers**
2. Click **"Import CSV"**
3. Upload: `/Users/voodoo808/Downloads/audience_export_d2f83d6160/subscribed_email_audience_export_d2f83d6160.csv`
4. The system will import emails + add tags automatically

---

## Option 3: Use Node.js Import Script

From the project directory:

```bash
# The import script is ready at:
node scripts/import-beatstars-audience.js

# Or use TypeScript version:
npx ts-node scripts/import-beatstars-audience.ts
```

**Note:** Requires DATABASE_URL environment variable set.

---

## 📊 What Gets Imported

**Source File:** `subscribed_email_audience_export_d2f83d6160.csv`
- **Total Records:** 5,051 customers
- **Status:** All set to marketing_consent=TRUE (active subscribers)
- **Source:** BeatStars platform (free beat downloads)
- **Names:** Extracted from "First Name" + "Last Name" columns

**Tags Applied to All:**
- ✓ `freebie` - Downloaded free content
- ✓ `beatstars` - Came from BeatStars platform
- ✓ `imported` - Bulk imported
- ✓ `subscribed` - Currently active/subscribed

---

## 🎯 After Import, You Can:

1. **Create Re-engagement Campaigns**
   - Target the `beatstars` tag with special offers
   - Convert free→paid at scale

2. **Enroll in Free→Paid Journeys**
   - All active subscribers auto-join "Free Beat Onboarding"
   - 30-day conversion sequence automatically runs
   - First email has 20% discount code (FIRST20)

3. **Segment for Targeted Campaigns**
   - Filter by tags: `freebie`, `beatstars`, `subscribed`
   - Send platform-specific content
   - Test new products with warm audience

4. **Track Engagement**
   - Open rates, click rates per segment
   - Purchase conversion tracking
   - ROI by source (BeatStars)

5. **A/B Test Subject Lines**
   - Campaigns → Create New → Test 2 subject lines
   - See which performs better with your audience

---

## 📈 Expected Outcomes

With 5,051 active subscribers + automated journeys:

- **Week 1:** Free→Paid journey runs, customers get 20% discount
- **Week 2-4:** Follow-up emails with tips, product recommendations
- **Month 2+:** Re-engagement campaigns for inactive subscribers
- **Conversion Target:** 2-5% of free users → paid (100-250 customers)

---

## 🔧 Technical Details

**Files Processed:**
- `/Users/voodoo808/Downloads/audience_export_d2f83d6160/subscribed_email_audience_export_d2f83d6160.csv` (5,054 rows, 5,051 valid)
- Unsubscribed file also available if needed later

**Database:**
- Table: `subscribers` (id, email, email_normalized, name, marketing_consent, marketing_consent_at, marketing_consent_source, first_source)
- Related: `subscriber_tags`, `tags`
- GDPR compliant: all records tracked with consent source

**Email Automation:**
- Scheduler runs every 2 minutes
- Journeys auto-trigger based on subscriber data
- All emails tracked: opens, clicks, status

---

## ❓ Troubleshooting

**"Invalid CSV format"**
- Make sure you're using the subscribed file (not unsubscribed)
- Headers must match: email, name
- All @ symbols should be present in email column

**"Duplicate email warnings"**
- This is normal - system will update existing subscribers
- ON CONFLICT clause ensures no duplicates

**"Import failed"**
- Check DATABASE_URL environment variable is set
- Ensure database has sufficient disk space
- Verify network connection if using remote DB

---

## 📧 First Campaign Idea

After import, send this welcome sequence:

1. **Day 0:** "Welcome to VOODOO808 – Here's 20% Off" 
   - Exclusive discount code FIRST20
   - Link to top 5 new beats

2. **Day 3:** "Sound Design Tip: How to Layer 808s"
   - Value content
   - Mention premium kits available

3. **Day 7:** "You Won't Believe These New Drops"
   - New releases email
   - Social proof ("3 of your friends bought this")

4. **Day 14:** "Ready to Go Exclusive?"
   - Upgrade path from free→exclusive license
   - Special pricing for early adopters

---

## ✅ Ready?

Pick Option 1, 2, or 3 above and run the import. Once done, your 5,051 BeatStars customers will start receiving automated journeys within 2 minutes!

For questions, check the Admin → Marketing → Subscribers dashboard to verify import succeeded.
