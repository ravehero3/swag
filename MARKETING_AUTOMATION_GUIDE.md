# VOODOO808 Marketing Automation - Complete Guide

## Quick Summary: What Just Happened

✅ **Email Activity Dashboard** - New "EMAIL AKTIVITA" tab added to Marketing section  
✅ **Transactional Journey Steps Fixed** - Journeys now properly load their email sequences  
✅ **Beat-Buyer vs Kit-Buyer Tracking** - Already correctly separated in the system  

---

## Email Automation Flow - How It Works

### Scenario 1: Customer Buys a Beat (Beaty Playlist)

1. **Purchase completes** → GoPay callback hits our API
2. **Backend calls** `onOrderCompleted(event)` 
3. **Subscriber tagged:**
   - "buyer" (general buyer tag)
   - "beat-buyer" ← **Specific marker for beat buyers only**
4. **Order Confirmation journey triggered** immediately
5. **Email sent:** "Vaše objednávka byla potvrzena" (Order confirmation)
6. **Logged to** `marketing_email_sends` table
7. **Can be filtered:** "beat-buyer" tag in campaigns

### Scenario 2: Customer Buys a Sound Kit (Zvuky Page)

1. **Purchase completes** → Same flow as beats
2. **Subscriber tagged:**
   - "buyer" (general buyer tag)
   - "kit-buyer" ← **Specific marker for kit buyers only**
3. **Order Confirmation journey triggered** immediately
4. **Email sent:** Same "Vaše objednávka byla potvrzena"
5. **Logged to** `marketing_email_sends` table
6. **Can be filtered:** "kit-buyer" tag in campaigns

### Scenario 3: Customer Downloads Free Beat

1. **Clicks "Stáhnout" on beaty.cz**
2. **Backend calls** `onFreebieDownloaded(event)` with source="beat"
3. **Subscriber created/updated with:**
   - Tag: "freebie"
   - Tag: One of ["808", "drums", "piano", "ambient", "synth", etc.] based on beat type
4. **Free Beat Onboarding journey triggered** (6 emails over 35 days)
5. **Emails queued:**

| Den | Čas | Email | Obsah |
|-----|------|-------|--------|
| **0** | Ihned | free_beat_onboarding_day3 | "Pojďme makat (20% sleva na vaši první exkluzivu)" - FIRST20 promo |
| **3** | +72h | browse_recovery_day1 | Retarget with similar vibe |
| **5** | +120h | browse_recovery_day3 | Recommend 3 trending beats |
| **15** | +240h | producer_tips_sound_design | Value content - production tips |
| **20** | +120h | abandoned_checkout_reminder | Final reminder if not purchased |
| **25** | +120h | abandoned_checkout_scarcity | Last chance offer - FIRST20 |

### Scenario 4: Customer Downloads Free Sound Kit

1. **Clicks "Stáhnout" on zvuky.cz**
2. **Backend calls** `onFreebieDownloaded(event)` with source="kit"
3. **Subscriber created/updated with:**
   - Tag: "freebie"
   - Tag: One of ["808", "chords", "melodic", "synth-leads", etc.] based on kit type
4. **Free Sound Kit Onboarding journey triggered** (5 emails over 34 days)
5. **Emails queued:**

| Den | Čas | Email | Obsah |
|-----|------|-------|--------|
| **0** | +72h | free_kit_onboarding_day3 | "Posuňte svoji produkci dál - Sleva uvnitř" - PRODUCER20 |
| **3** | +168h | producer_tips_sound_design | How I design exclusive sounds |
| **10** | +240h | browse_recovery_day3 | Recommend trending sound kits |
| **17** | +168h | weekly_newsletter_new_drops | New releases this week |
| **24** | +168h | kit_cross_sell | Bundle offer - beats + kits combo |

### Scenario 5: Customer Buys a Beat (After Exclusive License)

1. **Purchase completes** + marked as "beat_purchased"
2. **Post-Beat Purchase Upsell journey triggered** (8 emails over 45 days)
3. **Emails queued:**
   - Day 1: "Build community - ask what they recorded"
   - Day 6: Upsell custom arrangement service
   - Day 13: Recommend complementary kits + CROSS50
   - Day 20: Success stories from other producers
   - Day 27: Limited time remix challenge
   - Day 34: Producer tips - vocal arrangement
   - Day 41: Final bundle offer

### Scenario 6: Customer Buys a Sound Kit (After Purchase)

1. **Purchase completes** + marked as "kit_purchased"
2. **Post-Kit Purchase Upsell journey triggered** (5 emails over 45 days)
3. **Emails queued:**
   - Day 2: "How to use these sounds in production"
   - Day 10: Complement with recommended kit + CROSS50
   - Day 12: Browse recovery
   - Day 42: New exclusive kit releases
   - Day 56: Bundle beats with pro sound kits

---

## 🎯 All 11 Journeys Explained

### TRANSAKČNÍ (3 Transactional Journeys - Auto-Triggered)

| Journey | Trigger | When Sent | Emails | Purpose |
|---------|---------|-----------|--------|---------|
| **Order Confirmation** | `order_created` | When customer buys anything | 1 | Receipt + Download Links |
| **License Delivery** | `digital_license_ready` | When exclusive license prepared | 2 | License file + 3-day follow-up |
| **Invoice & Receipt** | `invoice_ready` | When invoice generated | 1 | Formal invoice documentation |

### ONBOARDING (2 Free Content Journeys)

| Journey | Trigger | Sequence | Purpose |
|---------|---------|----------|---------|
| **Free Beat Onboarding** | `beat_downloaded` | 6 emails / 35 days | Convert free beat downloaders → buyers |
| **Free Sound Kit Onboarding** | `kit_downloaded` | 5 emails / 34 days | Convert free kit downloaders → buyers |

### UPSELL (2 Post-Purchase Journeys)

| Journey | Trigger | Sequence | Purpose |
|---------|---------|----------|---------|
| **Post-Beat Purchase Upsell** | `beat_purchased` | 8 emails / 45 days | Maximize engagement after exclusive beat buy |
| **Post-Kit Purchase Upsell** | `kit_purchased` | 5 emails / 45 days | Maximize engagement after kit buy |

### RETENTION & ENGAGEMENT (4 Behavioral Journeys)

| Journey | Trigger | Frequency | Purpose |
|---------|---------|-----------|---------|
| **Inactive Users Recovery** | `inactive_90days` | On-demand | Re-engage 90-day inactive |
| **Cart Abandonment** | `cart_abandoned` | Automatic | Recover abandoned purchases |
| **Newsletter Signup** | `newsletter_signup` | Welcome series | 3-email welcome sequence |
| **Win-Back Campaign** | `product_viewed` | Behavioral trigger | Re-engage browsers |

---

## 📊 Subscriber Tags (For Segmentation)

### Purchase Tags
- **buyer** - Anyone who bought anything
- **beat-buyer** - Specifically bought beats ← Can target with beat-only campaigns
- **kit-buyer** - Specifically bought kits ← Can target with kit-only campaigns

### Content Tags
- **freebie** - Downloaded free content
- **808** - Interested in 808 drums
- **drums** - Interested in drum content
- **melodic** - Interested in melodic sounds
- **synth-leads** - Interested in synth leads
- **chords** - Interested in chord progressions

### Engagement Tags
- **newsletter** - Subscribed to newsletter
- **inactive** - No activity for 90 days
- **active** - Recent activity

---

## 🎯 Email Activity Dashboard (NEW)

**Location:** Marketing → Email Aktivita

**Shows:**
- ✅ All transactional emails sent (last 7/30/90 days)
- ✅ Campaign emails sent
- ✅ Recipient email addresses
- ✅ Subject lines
- ✅ Journey/Campaign name
- ✅ Send status (✓ Sent / ✗ Failed)
- ✅ Engagement metrics (Opens, Clicks, Unsubscribes)
- ✅ Send timestamp

**Filters:**
- Date range (1, 7, 30, 90 days)
- Specific journey
- Email type (All, Transactional, Marketing, Campaign)
- Status (All, Sent, Failed)

**Stats Dashboard:**
- Total sent (count)
- Success rate (%)
- Open rate (%)
- Click rate (%)

---

## 🔧 Technical Details

### Database Tables
- `marketing_journeys` - Journey definitions
- `marketing_journey_steps` - Individual emails within journeys
- `marketing_templates` - 21 reusable email templates
- `marketing_enrollments` - Tracks which subscribers are in which journeys
- `marketing_email_sends` - Log of ALL emails sent (transactional + campaigns)
- `marketing_email_opens` - Tracks opens/clicks/unsubscribes
- `campaign_send_queue` - Queues campaign emails respecting rate limits
- `campaign_rate_limits` - 85/day, 4/hour limits for Resend free tier

### Key Discount Codes
- **FIRST20** - 20% off any exclusive beat license
- **PRODUCER20** - 20% off any premium sound kit
- **CROSS50** - 50% off bundle (beats + kits combo)

### Rate Limiting (Resend Free Tier)
- Hard limit: 85 emails/day
- Hard limit: 4 emails/hour
- Scheduler runs every 15 minutes
- Auto-resets daily at 00:00 UTC, hourly at :00

---

## ✅ What Works Now

✅ When customers buy beats → Order Confirmation email sent + tagged "beat-buyer"  
✅ When customers buy kits → Order Confirmation email sent + tagged "kit-buyer"  
✅ When customers download free beats → 6-email 35-day journey queued  
✅ When customers download free kits → 5-email 34-day journey queued  
✅ All emails logged in database with engagement tracking  
✅ Can view all sent emails in Email Activity dashboard  
✅ Can filter by journey, email type, date range, status  
✅ Beat-buyer vs kit-buyer tags never mixed  
✅ Transactional journeys show proper step sequences  

---

## 🚀 Next: Potential Enhancements

### Priority 1: Test the System
1. Create a test purchase of a beat (or use test data)
2. Check Email Activity tab - should show order confirmation email
3. Check `marketing_email_sends` table - should have entry
4. Verify "beat-buyer" tag on subscriber

### Priority 2: Email Segmentation in Campaigns
- Create campaign targeting only "beat-buyer" subscribers
- Create campaign targeting only "kit-buyer" subscribers
- Add toggle in campaign UI: "Send to beat buyers", "Send to kit buyers"

### Priority 3: Campaign Performance Tracking
- Add comparison view: "campaigns sent to beat-buyers vs kit-buyers"
- Show open rates by product type
- Show conversion rates by product type

### Priority 4: Real-Time Engagement Dashboard
- Live email send rate graph
- Real-time open/click tracking
- Heat map of most clicked emails

---

## 📝 API Endpoints

### Get Email Activity
```
GET /api/marketing/email-activity?days=7&journeyId=1&emailType=all&status=all&limit=50&offset=0
```

### Get Journeys with Step Counts
```
GET /api/marketing/journeys
```
Returns: Journey list with `stepCount`, `activeEnrollments`, `completedEnrollments`, `emailsSent`

### Seed Transactional Journeys
```
POST /api/marketing/journeys/seed
```
Auto-seeds 3 transactional journeys + all templates

---

## 💡 Why the Numbers Were Zero

**Before fix:** Transactional journeys didn't have their steps inserted into database (INSERT missing `step_type`)  
**After fix:** Steps are now properly created, so:
- `stepCount` shows actual number of emails in sequence
- `activeEnrollments` shows customers currently in that journey
- `completedEnrollments` shows customers who finished the journey
- `emailsSent` shows total emails delivered

---

## Questions?

Check these files for implementation details:
- `server/src/lib/journeySeeds.ts` - All 11 journey definitions + email sequences
- `server/src/lib/templateSeeds.ts` - All 21 email templates + Czech content
- `server/src/lib/marketing/hooks.ts` - When journeys are triggered (purchase, download, etc.)
- `server/src/routes/marketing.ts` - All API endpoints
- `client/src/components/EmailActivityTab.tsx` - Email Activity dashboard UI
