# 🚀 JOURNEY CONTAINERS NOW LIVE - Action Guide

## What Just Changed

✅ **All 8 journeys are now seeded in the database**
✅ **Admin UI properly categorizes them into 4 groups**
✅ **Names match exactly between database and UI**

## What You Need to Do NOW

### Step 1: Rebuild/Restart Your App
The journeys are seeded on database initialization. You need to:

**Option A - Full DB Reset (Recommended first time):**
```bash
# Drop and recreate database
psql -U your_user -d your_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restart the app - db.ts will re-seed everything
npm run dev
```

**Option B - If DB Already Exists:**
Just restart the app. The seed will check for existing journeys and skip duplicates:
```bash
npm run dev
```

### Step 2: Verify Journey Containers Appear
1. Go to Admin → Marketing → Journeys
2. You should see **4 category sections**:
   - 📌 **Lead Magnets & Onboarding** (2 journeys)
   - 💰 **Conversion & Recovery** (2 journeys)  
   - 🎓 **Nurture & Relationship** (2 journeys)
   - 🔁 **Post-Purchase & Retention** (2 journeys)

3. Each journey appears as a **professional card** with:
   - Journey name
   - Status badge
   - Trigger type
   - Key metrics (Active, Completed, Emails Sent)
   - Activate/Pause button

### Step 3: Build Email Templates
Each journey step references a template `templateKey`. These don't exist yet, so you need to create them:

**Templates Needed (17 total):**

#### Lead Magnets (2):
- `freebie_delivery` - "Thank you for downloading!"
- `freebie_offer` - "Ready for more?"

#### Conversions (3):
- `beat_onboarding_followup` - "What did you record?"
- `discount_offer_20pct` - "Special: 20% off your first purchase"
- `abandoned_cart_reminder` - "Did you forget?"

#### Browse Recovery (2):
- `browse_recovery_day1` - "That beat you were checking..."
- `browse_recovery_day3` - "Still interested? Here's 15% off"

#### Rapper Nurture (3):
- `rapper_tip_spotify` - "How to get on Spotify playlists"
- `rapper_tip_mixing` - "Mixing vocals over pre-made beats"
- `rapper_beat_drop` - "New beats just added!"

#### Producer Nurture (3):
- `producer_tutorial_video` - "Video tutorial link"
- `producer_melody_breakdown` - "How I made this melody"
- `producer_beat_selling_tips` - "Monetize your beats 101"

#### Post-Purchase (4):
- `ask_for_track_link` - "Send us your finished track!"
- `upgrade_to_unlimited` - "Upgrade to unlimited rights"
- `kit_crosssell_matching` - "The perfect companion kit"
- `kit_bundle_discount` - "Complete producer bundle (40% off)"

**Also reuse existing:**
- `post_purchase_thanks` (already exists)
- `producer_tip_1` (already exists)
- `welcome_intro` (already exists)

### Step 4: Create Templates via Admin UI
1. Go to Admin → Marketing → Šablony (Templates)
2. Click "+ Nová šablona" for each missing template
3. Fill in: Name, Subject, HTML content
4. Use the `key` field to set the template key (must match journey references)

**Template Name Format:**
Use the same key - e.g., `freebie_delivery` as both name and key

### Step 5: Wire Steps Into Journeys
1. Click a journey card (e.g., "Free Beat Onboarding")
2. You'll see the flow canvas with empty steps
3. For each step, edit and:
   - Select the email template from dropdown
   - Confirm delay (hours) matches journey design
   - Add any additional logic (tags, conditions)

### Step 6: Test & Activate
1. For each journey, enter test email in "Testovací e-mail" field
2. Click the test icon on each step
3. Check email renders correctly
4. When satisfied: Click "Aktivovat" button on the journey card

---

## Expected Timeline

- **Templates creation:** 30-60 minutes (create 17 templates)
- **Wire steps into journeys:** 30-45 minutes (configure each journey)
- **Testing:** 30-60 minutes (send tests, verify)
- **Total:** 2-3 hours to get all 8 journeys live

---

## Important Notes

✅ All journeys start in `draft` status - won't send emails until you activate
✅ Templates are optional initially - preview won't break, just won't show email content
✅ You can edit journeys anytime, activate/pause with one click
✅ Each journey is independent - start with highest-impact ones first

---

## Recommended Activation Order (By Revenue Impact)

1. **Abandoned Checkout Recovery** - Quick wins, immediate ROI
2. **Free Beat Onboarding** - Warm leads → paid customers
3. **Post-Beat Purchase Upsell** - Increase average order value
4. **Free Sound Kit Onboarding** - Long-term customer value
5. **Kit Cross-Sell Series** - Bundle sales
6. **Browse Abandonment Recovery** - Secondary recovery
7. **Rapper Growth & Tips Series** - Nurture, repeat purchases
8. **Producer Growth & Tutorials Series** - Nurture, brand loyalty

---

## Monitoring Dashboard

Once active, track per-journey metrics:
- Email open rate
- Click-through rate (CTR)
- Conversion rate
- Revenue attributed
- Unsubscribe rate

Accessible from the Admin Journeys tab for each card.

---

## Next: Template Creation Guide

Ready to build templates? Open `JOURNEY_STRATEGY.md` Section 4 for exact copy suggestions and personalization variables for each template.
