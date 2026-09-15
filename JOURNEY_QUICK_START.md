# 🎵 VOODOO808 Journey Setup - Quick Start

## What Just Got Built

Your journeys tab now displays all 8 customer journeys organized by business goal:

```
┌─────────────────────────────────────────┐
│ LEAD MAGNETS & ONBOARDING               │ ← Convert free → paid (3-5 days)
│ └─ Free Beat Onboarding (Rappers)      │
│ └─ Free Sound Kit Onboarding (Producers)│
├─────────────────────────────────────────┤
│ CONVERSION & RECOVERY                   │ ← Win back abandoned carts
│ └─ Abandoned Checkout Recovery          │
│ └─ Browse Abandonment Recovery          │
├─────────────────────────────────────────┤
│ NURTURE & RELATIONSHIP                  │ ← Build trust, top-of-mind
│ └─ Rapper Growth & Tips Series          │
│ └─ Producer Growth & Tutorials Series   │
├─────────────────────────────────────────┤
│ POST-PURCHASE & RETENTION               │ ← Repeat sales, upgrades
│ └─ Post-Beat Purchase Upsell            │
│ └─ Kit Cross-Sell Series                │
└─────────────────────────────────────────┘
```

Each journey appears in a professional card container:
- ✅ Status badge (active/paused/draft)
- ✅ Key metrics (active users, completed, emails sent)
- ✅ Quick activate/pause button
- ✅ Click to see full sequence visualization

## Next Steps (DO THIS NOW)

### Step 1: Create the Journeys
Option A (Recommended - Via UI):
1. Go to Admin → Marketing → Journeys
2. For each journey card, review the name and description
3. They should already be listed - if not, manually create them:
   - Free Beat Onboarding
   - Free Sound Kit Onboarding
   - Abandoned Checkout Recovery
   - Browse Abandonment Recovery
   - Rapper Growth & Tips Series
   - Producer Growth & Tutorials Series
   - Post-Beat Purchase Upsell
   - Kit Cross-Sell Series

Option B (Via API/Script):
```bash
bash scripts/seed-journeys.sh http://localhost:5000
```

### Step 2: Build Email Templates
For each journey, you need email templates. Create these first:

#### Lead Magnets (2 templates)
- "Free Beat Download Confirmation"
- "Free Kit Download Confirmation"

#### Conversion Recovery (2 templates)
- "Abandoned Cart Reminder"
- "Browse Recovery - Did You Forget This Beat?"

#### Nurture Content (6+ templates)
- "Rapper Tip: Spotify Playlist Tips"
- "Producer Tutorial: Video Link"
- "New Beat Drop Alert"
- "Producer Interview: Success Story"
- (Create more as you go)

#### Post-Purchase (2 templates)
- "Thank You! Your Beat Awaits"
- "Upgrade to Unlimited Rights - Special Offer"

### Step 3: Wire Steps Into Each Journey
Click each journey card → View its sequence → Add steps:

**Free Beat Onboarding (Rappers)**
- Step 1 (Day 0): Send "Free Beat Confirmation" email + add tag `role:rapper`
- Step 2 (Day 2): Wait 48h, then send "What Did You Record?" email
- Step 3 (Day 3): Wait 24h, then send "20% Discount Offer" email

**Free Sound Kit Onboarding (Producers)**
- Step 1 (Day 0): Send "Free Kit Confirmation" email + add tag `role:producer`
- Step 1b: Add tag `status:lead_free`
- Step 2 (Day 1): Wait 24h, then send "Processing Tip" email
- Step 3 (Day 3): Wait 48h, then send "Premium Kits Intro" email

...and so on for all 8 journeys (see JOURNEY_STRATEGY.md for full details)

### Step 4: Test Before Activating
1. Click each journey
2. Use the "Testovací e-mail" field to send a test
3. Check that:
   - Subject line looks good
   - Email renders properly
   - Links work
   - Variables ({{first_name}}, etc.) display correctly

### Step 5: Set Up Tagging
Modify your backend hooks to auto-tag users:

**In `server/src/lib/marketing/hooks.ts`:**
- When user downloads free beat → add tag `role:rapper`
- When user downloads free kit → add tag `role:producer`
- When user completes purchase → add tag `status:customer_paid`
- When user has 3+ purchases → add tag `status:vip_repeat`

**In `server/src/routes/leads.ts` and `orders.ts`:**
- Call `upsertSubscriber()` with appropriate tags

### Step 6: Monitor & Optimize
Each journey's card shows:
- Active enrollments (# of users currently in journey)
- Completed (# who finished journey)
- Emails sent (# of emails delivered)

Track over 30 days:
- Which journeys have highest open/click rates?
- Which drive most revenue?
- Which have highest unsubscribe rate?

Iterate on email subject lines, offers, timing based on data.

---

## Business Impact Projection

Once fully set up and optimized:

**Monthly Revenue from Journeys:**
- Free → Paid Conversion: +$2-5k (from abandoned recovery + onboarding)
- Repeat Purchases: +$3-8k (from post-purchase + nurture series)
- Cross-sells: +$1-3k (from kit cross-sell)

**Total**: +$6-16k/month incremental revenue
(Varies based on email list size and engagement rates)

---

## Files Created

- `JOURNEY_STRATEGY.md` — Complete strategy & documentation
- `scripts/seed-journeys.sh` — Script to create all 8 journeys
- Admin UI — Professional categorized journey containers

## Questions?

See `JOURNEY_STRATEGY.md` for:
- Full sequence details
- Tagging strategy
- Expected metrics
- Personalization variables
- Implementation checklist
- Future enhancements
