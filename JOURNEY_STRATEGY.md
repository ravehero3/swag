# VOODOO808 Complete Journey Setup Guide

## Overview
This guide documents the 8 core customer journeys designed to maximize revenue from your two audiences: **Rappers** (beat buyers) and **Producers** (kit buyers).

## Journey Categories & Architecture

### 1. LEAD MAGNETS & ONBOARDING (Immediate Conversion)
These journeys trigger the moment someone downloads a free item. Goal: Move free users to paid customers within 3-5 days.

#### 1a. Free Beat Onboarding (For Rappers)
**Trigger:** `freebie_downloaded` with `trigger_value: "beat"`

**Sequence:**
- **Day 0 (Immediate):** Deliver MP3 download link + welcome message
- **Day 2:** Follow-up email: "What did you record over this beat?" (Build relationship, understand their style)
- **Day 3:** Pitch: "Get 20% off your first exclusive beat or unlimited license" (Include discount code)

**Expected Results:**
- 15-25% conversion to paid customers
- Average order value: $15-45 (beat lease or download)

---

#### 1b. Free Sound Kit Onboarding (For Producers)
**Trigger:** `freebie_downloaded` with `trigger_value: "kit"`

**Sequence:**
- **Day 0 (Immediate):** Deliver WAV/MIDI files + quick-start guide
- **Day 1:** Send a production tip (e.g., "How I processed these 808s for that trap vibe")
- **Day 3:** Introduce your flagship kits: "Level up with our Complete Producer Bundle" (Include testimonial + before/after)

**Expected Results:**
- 10-20% conversion to kits ($29-99 each)
- Higher LTV (Lifetime Value) than rappers

---

### 2. CONVERSION & RECOVERY (High-Intent Users)
These journeys target users who showed strong purchase intent but abandoned before completing checkout.

#### 2a. Abandoned Checkout Recovery
**Trigger:** `abandoned_checkout` (Custom event: user adds to cart but doesn't buy)

**Sequence:**
- **1-2 hours after abandonment:** "Did you forget your [product name]?" (Simple reminder, minimal pressure)
  - Include product image, BPM/key info, license type they selected
  - Link directly back to checkout (prefill cart)
- **24 hours later:** "Last chance! Grab [product] + get 15% off if you order in the next 24h"
  - Add scarcity element (limited-time code)
  - Include testimonial or social proof

**Expected Results:**
- 5-15% recovery rate (of abandoned carts)
- Average recovered order: $30-60

---

#### 2b. Browse Abandonment Recovery
**Trigger:** `page_view_no_action` (User spends 2+ minutes on beat/kit page but doesn't add to cart)

**Sequence:**
- **Day 1:** "That [Drake-type/Juice-type] beat you were checking..." 
  - Repackage the exact product they viewed
  - Highlight BPM, key, mood, artist comparisons
  - Include audio clip + specs
  - Offer "Listen free for 7 days" or "30-day money-back guarantee"
- **Day 3:** Follow-up: "Still thinking about it? [Discount/bonus offer]"
  - Sample 3 similar products they might like
  - Include FAQ about licensing

**Expected Results:**
- 3-8% conversion rate
- Average order: $15-50

---

### 3. NURTURE & RELATIONSHIP (Trust Building)
These journeys are long-term plays to establish your brand as THE go-to for music production.

#### 3a. Rapper Growth & Tips Series
**Trigger:** Tag `role:rapper` (Applied when user downloads beat or purchases beat license)

**Sequence** (Recurring weekly, opt-out available):
- **Week 1:** "How to Get Your Tracks on Spotify Playlists" (Educational value)
- **Week 2:** "Vocal Mixing Tips Over Pre-Made Beats" (Tutorial)
- **Week 3:** "New Beat Drop: 5 Drake-Type Beats Just Added" (Sales opportunity, soft)
- **Week 4:** "Feature Your Song on Our Instagram" (Community building, UGC request)
- **Repeat with different content** (Avoid monotony, vary between education, entertainment, sales)

**Email Variations by Status:**
- If `status:lead_free`: Focus on education, light upsells
- If `status:customer_paid`: Higher-value upsells (exclusive rights, unlimited licenses, beat packs)

**Expected Results:**
- 20-30% open rate
- 3-5% click rate
- Drives repeat purchases over 6+ months

---

#### 3b. Producer Growth & Tutorials Series
**Trigger:** Tag `role:producer` (Applied when user downloads kit or purchases kit)

**Sequence** (Recurring weekly, opt-out available):
- **Week 1:** "How I Designed This Drum Kit (5-min video)" (Behind-the-scenes)
- **Week 2:** "Melody Breakdown: Building the Next Hit Hook" (Tutorial)
- **Week 3:** "Sell Your Beats Online: Licensing 101" (Value-add)
- **Week 4:** "New Kit Alert: 500 Fresh Loops Just Released" (Sales opportunity)
- **Repeat** (Monthly producer challenges, new kit launches, success stories)

**Email Variations by Status:**
- If `status:lead_free`: Free tutorials, free sample packs
- If `status:customer_paid`: Exclusive templates, early access to new kits, producer interviews

**Expected Results:**
- 25-35% open rate (higher because content is specialized)
- 5-8% click rate (strong professional interest)
- 15-25% cross-sell rate (kit bundles)

---

### 4. POST-PURCHASE & RETENTION (Maximize LTV)
It's 5-25x cheaper to sell to existing customers than find new ones. These journeys focus on repeat purchase and upgrade upsells.

#### 4a. Post-Beat Purchase Upsell
**Trigger:** `has_purchased` with `trigger_value: "beat"` + `status:customer_paid`

**Sequence:**
- **Day 0 (Immediate):** "Your beat is ready! Download + License info"
  - Attach files (MP3, WAV, trackout if purchased)
  - Include license terms & usage rights
  - Attach contract (if applicable)
- **Day 3:** "What did you record?" (Follow-up, engagement)
  - Ask for finished track link
  - Offer to feature on Instagram stories (free promo for them)
- **Day 5:** "Upgrade Offer: Get Unlimited Rights for Just $10 More"
  - Explain difference between lease (current) vs unlimited
  - Show value (unlimited revisions, re-release, sampling)
  - Include testimonial from artist who upgraded
- **Day 10:** "Beat Packs Available: Save 30% When You Buy 3+ Beats"
  - Bundle similar beats at discount
  - Tease best performers from this month

**Expected Results:**
- 8-15% upgrade conversion
- 20-35% repeat purchase within 30 days
- Average upsell: $10-25 per customer

---

#### 4b. Kit Cross-Sell Series
**Trigger:** `has_purchased` with `trigger_value: "kit"` + `status:customer_paid`

**Sequence:**
- **Day 0 (Immediate):** "Your kit is ready! Download + Usage tips"
  - Deliver WAV/MIDI files
  - Quick-start guide (preset info, BPM, key)
- **Day 2:** "Pro Tip: Pair [Drum Kit] with [Melody Kit] for Maximum Impact"
  - Show how they complement each other
  - Include audio demo (drum kit alone vs paired)
  - Offer bundle discount (e.g., "Get the matching Melody Kit for 50% off")
- **Day 7:** "Your [Category] Kit + These 3 Other Kits = Complete Production Arsenal"
  - Show recommended bundle for their genre
  - Include BPM/key compatibility chart
  - Highlight savings (30-40% off buying separate)
- **Day 14:** "New Presets Added to [Your Category]"
  - Fresh content in kits they own
  - New bundle options

**Expected Results:**
- 15-25% cross-sell conversion rate
- Average cross-sell: $25-60 per customer
- 30-40% repeat purchase rate

---

## Tagging Strategy (Critical for Audience Segmentation)

### Primary Tags: User Role
- `role:rapper` → Applied when user downloads beat or purchases beat license
- `role:producer` → Applied when user downloads kit or purchases kit
- `role:both` → Applied if user purchases both beats AND kits (don't send both series)

### Status Tags: Purchase History
- `status:lead_free` → Free download, no purchase yet
- `status:customer_paid` → Has purchased at least once
- `status:vip_repeat` → 3+ purchases OR $300+ lifetime value
- `status:inactive` → No engagement in 60+ days

### Engagement Tags: Interest & Behavior
- `engagement:high_performer` → 50%+ email open rate
- `engagement:low_performer` → <10% open rate (consider re-engagement campaign)
- `engagement:vip_tier` → Purchased exclusive rights or beat packs

### Product Tags: Purchase Type
- `product:beat_lease` → Purchased beat lease (lowest commitment)
- `product:beat_unlimited` → Purchased unlimited rights
- `product:beat_exclusive` → Purchased exclusive rights (premium)
- `product:kit_starter` → Purchased starter kit
- `product:kit_pro` → Purchased professional kit bundle

### Engagement Tags: Channel Preference
- `channel:email_only` → Prefers email (default)
- `channel:instagram_feature` → Opted-in to Instagram features
- `channel:newsletter` → Subscribed to weekly newsletter

---

## Implementation Checklist

- [ ] Create all 8 journeys via API or admin UI
- [ ] Build email templates for each journey step
- [ ] Set up tagging logic in hooks (leads.ts, orders.ts, index.ts)
- [ ] Test tagging with sample orders
- [ ] Create test subscribers with role tags
- [ ] Send test emails for each journey
- [ ] Monitor open/click rates
- [ ] Enable analytics tracking for each journey
- [ ] Set up revenue attribution per journey
- [ ] Document customizations

---

## Key Metrics to Track

### Immediate Metrics (Within 7 days)
- Email open rate by journey
- Click-through rate (CTR)
- Conversion rate (free → paid)

### Medium-term Metrics (30 days)
- Customer acquisition cost (CAC) per journey
- Repeat purchase rate by journey
- Average order value (AOV) by journey

### Long-term Metrics (90+ days)
- Customer lifetime value (LTV) by journey
- Churn rate by journey
- Revenue generated per journey

---

## Personalization Variables Available

### Subscriber Info
- `{{first_name}}` → Subscriber's first name
- `{{email}}` → Subscriber's email
- `{{subscriber_role}}` → "Rapper" or "Producer"

### Product Info (for specific items)
- `{{product_name}}` → Beat/Kit name
- `{{product_bpm}}` → BPM
- `{{product_key}}` → Musical key
- `{{product_mood}}` → Mood/vibe
- `{{artist_comparison}}` → Artist style (e.g., "Drake-type")

### Purchase Info
- `{{purchase_date}}` → When they bought
- `{{purchase_total}}` → $ amount
- `{{license_type}}` → Type of license
- `{{download_link}}` → Personalized download

---

## Future Enhancements (Phase 2)

1. **A/B Testing**: Test subject lines, CTAs, discount levels
2. **Dynamic Content**: Show different kits based on their past purchases
3. **Re-engagement Campaign**: Win back inactive users (60+ days no engagement)
4. **Revenue Attribution**: Track which journey drove each sale
5. **Subscriber Segmentation Preview**: Before activating, see who qualifies
6. **Conditional Send Times**: Send at subscriber's local time zone
7. **Survey Follow-ups**: Ask why they abandoned cart or didn't convert

---

## Questions?

- Email strategy questions → Refer to AI recommendations
- Technical implementation → Check Admin UI or API docs
- Testing & optimization → Monitor metrics, A/B test subject lines and offers
