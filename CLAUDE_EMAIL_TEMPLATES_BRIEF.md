# 📧 BRIEF FOR CLAUDE: WRITE 12 EMAIL TEMPLATES FOR VOODOO808

## CONTEXT

**Business:** VOODOO808 - Music production marketplace selling:
- **Beats** to rappers (licensing: lease, unlimited, exclusive)
- **Sound Kits** to producers (plugins, presets, samples)

**Goal:** Create 12 professional email templates for automated customer journeys that convert free users to paid customers and increase repeat purchases.

---

## THE 8 JOURNEYS & THEIR EMAIL TEMPLATES

Each journey has 2-3 emails. We need 12 templates total (some journeys share templates).

### Journey 1: Free Beat Onboarding (For Rappers)
Trigger: Rapper downloads free beat

**Email 1:** Welcome + Delivery (Day 0)
- Deliver the beat they downloaded
- Welcome message
- Hint at paid beats available

**Email 2:** Engagement (Day 2)
- Ask them what they recorded
- Build relationship
- Light upsell

**Email 3:** Conversion (Day 3)
- Offer 20% off first paid beat or unlimited license
- Include discount code
- TEMPLATE NAME: `free_beat_onboarding_day3_discount`

---

### Journey 2: Free Kit Onboarding (For Producers)
Trigger: Producer downloads free kit

**Email 1:** Welcome + Delivery (Day 0)
- Deliver the kit they downloaded (WAV/MIDI files)
- Quick-start guide included
- Welcome to producer community

**Email 2:** Educational (Day 1)
- Production tip (how you processed sounds, etc.)
- Shows expertise
- Soft value-add

**Email 3:** Conversion (Day 3)
- Showcase flagship kits
- Include testimonial
- Include before/after audio demo

---

### Journey 3: Abandoned Checkout Recovery
Trigger: User adds beat/kit to cart but doesn't buy

**Email 1:** Gentle Reminder (1-2 hours after abandonment)
- "Did you forget your [product name]?"
- Include product image/BPM/key
- Direct back to checkout (prefilled)
- No pressure

**Email 2:** Scarcity + Incentive (24 hours later)
- "Last chance! [Product] + 15% off if you order today"
- Show social proof (reviews, testimonials)
- Limited-time offer creates urgency

---

### Journey 4: Browse Abandonment Recovery
Trigger: User spends 2+ minutes on product page but doesn't add to cart

**Email 1:** Personalized Reminder (Day 1)
- "That [Artist-type] beat you were checking out..."
- Repackage the exact product they viewed
- Include audio clip + specs
- Offer: "Listen free for 7 days" or "30-day money-back guarantee"

**Email 2:** Similar Products + FAQ (Day 3)
- Still thinking about it? Here's your offer
- Show 3 similar products they might like
- Include FAQ about licensing

---

### Journey 5: Rapper Growth & Tips (Recurring weekly)
Trigger: Tag `role:rapper` (after downloading or buying beat)

**Templates (Rotate weekly, send every 7 days):**

**Email 1:** Educational - "How to Get Your Tracks on Spotify"
- Focus: Value-add content
- For leads: Free tips
- For customers: Advanced tips + testimonials

**Email 2:** Tutorial - "Vocal Mixing Tips Over Pre-Made Beats"
- How to mix vocals over beats
- Include video or tips
- Light upsell: "Try our vocal-friendly beats"

**Email 3:** Product Launch - "New Beat Drop: 5 Drake-Type Beats"
- Announce new beats in their style
- Show audio clips + BPM/key
- Call-to-action: Browse, listen, buy

**Email 4:** Community - "Feature Your Song on Our Instagram"
- Ask for UGC (user-generated content)
- They get free promo
- Builds community

---

### Journey 6: Producer Growth & Tutorials (Recurring weekly)
Trigger: Tag `role:producer` (after downloading or buying kit)

**Templates (Rotate weekly, send every 7 days):**

**Email 1:** Behind-the-Scenes - "How I Designed This Drum Kit (5-min video)"
- Show your process
- Builds credibility
- For leads: Free insights
- For customers: Exclusive content

**Email 2:** Tutorial - "Melody Breakdown: Building the Next Hit Hook"
- Production technique
- How to use kits
- Link to video or audio

**Email 3:** Educational - "Sell Your Beats Online: Licensing 101"
- Help them understand licensing
- Positions you as expert
- Soft upsell: "That's why our kits are designed for licensing"

**Email 4:** Product Launch - "New Kit Alert: 500 Fresh Loops Released"
- Announce new kits
- Highlight what's new
- Include audio demo

---

### Journey 7: Post-Beat Purchase Upsell
Trigger: User purchases a beat

**Email 1:** Delivery (Day 0)
- "Your beat is ready!"
- Attach files (MP3, WAV, trackout)
- Include license terms
- Setup: Explain what they own

**Email 2:** Engagement (Day 3)
- "What did you record over this beat?"
- Ask for finished track
- Offer Instagram feature (free promo)

**Email 3:** Upsell (Day 5)
- "Upgrade to Unlimited Rights for just $10 more"
- Explain: Lease vs Unlimited vs Exclusive
- Show value: Unlimited revisions, re-release, sampling
- Include testimonial from someone who upgraded

**Email 4:** Cross-sell (Day 10)
- "Beat Packs: Save 30% when you buy 3+ beats"
- Bundle similar beats
- Show what's popular

---

### Journey 8: Kit Cross-Sell
Trigger: User purchases a kit

**Email 1:** Delivery (Day 0)
- "Your kit is ready!"
- Attach files (WAV/MIDI)
- Include quick-start guide
- Setup: Explain BPM, key, format

**Email 2:** Pairing Suggestion (Day 2)
- "Pair [Drum Kit] with [Melody Kit] for Maximum Impact"
- Show audio demo (alone vs paired)
- Offer bundle discount: "Get matching kit for 50% off"

**Email 3:** Arsenal Build (Day 7)
- "Your [Category] Kit + These 3 Kits = Complete Arsenal"
- Show recommended bundle
- Include BPM/key compatibility chart
- Highlight savings (30-40% off)

**Email 4:** New Content (Day 14)
- "New Presets Added to [Your Category]"
- Fresh content in kits they own
- New bundle options

---

## DESIGN & TONE REQUIREMENTS

### Brand Voice
- **Professional but approachable** (not corporate, not too casual)
- **Music producer to musician/producer** (peer-to-peer, credible)
- **Action-oriented** (clear CTAs, no fluff)
- **Value-focused** (always give something: tip, discount, entertainment, education)

### Email Structure (for each template)
```
1. Subject Line (compelling, curiosity or benefit)
2. Preheader (preview text, reinforces subject)
3. Greeting (personalized: Hi {{first_name}} or Hi {{subscriber_role}})
4. Hook (1-2 sentences, why they should read)
5. Body (main content: tip, story, product info)
6. CTA (clear button or link: "Listen", "Buy Now", "Download", "Watch")
7. Footer (unsubscribe, social links, brief branding)
```

### Tone by Journey Type
- **Onboarding (Welcome):** Warm, excited, welcoming
- **Educational:** Expert, helpful, credible
- **Conversion/Upsell:** Conversational, benefit-focused, urgency
- **Abandonment Recovery:** Helpful, no hard-sell, remove friction
- **Community/Engagement:** Personal, friendly, inclusive

---

## PERSONALIZATION & VARIABLES

Available variables to use:
- `{{first_name}}` - Subscriber's first name
- `{{subscriber_role}}` - "Rapper" or "Producer"
- `{{product_name}}` - Beat/Kit name
- `{{product_bpm}}` - BPM
- `{{product_key}}` - Musical key (e.g., "C Minor")
- `{{product_mood}}` - Mood/vibe (e.g., "Dark trap", "Lo-fi chill")
- `{{artist_comparison}}` - Artist style (e.g., "Drake-type", "Travis Scott vibes")
- `{{purchase_date}}` - When they bought
- `{{license_type}}` - Type of license they selected
- `{{download_link}}` - Personalized download
- `{{discount_code}}` - Unique discount code

**Example:** "Hey {{first_name}}, that {{artist_comparison}} beat you downloaded is perfect for {{subscriber_role}}s who want..."

---

## KEY CONVERSION PSYCHOLOGY

### For Rappers (Beat Buyers)
- Focus: Artist identity, song quality, licensing freedom
- Pain point: Don't know which beat to choose, licensing confusion
- Motivation: Release music, get streams, build fanbase
- Messaging: "Professional sound", "Ready to release", "Clear licensing"

### For Producers (Kit Buyers)
- Focus: Production quality, workflow efficiency, creative possibilities
- Pain point: Time spent on sound design, kit compatibility
- Motivation: Make hits, sell beats, impress clients
- Messaging: "Pro-grade sounds", "Time-saving presets", "Commercial ready"

---

## DISCOUNT STRATEGY

- **First-time buyer:** 15-20% off
- **Upgrade incentive:** $10-20 off (e.g., lease → unlimited)
- **Bundle/multi-buy:** 25-30% off (buy 3+ beats)
- **Limited-time urgency:** "Offer expires in 24 hours"

---

## WHAT TO INCLUDE IN EACH EMAIL

### Always Include:
- ✅ Clear subject line (no spam words)
- ✅ Personalization (name or role)
- ✅ One primary CTA (button or link)
- ✅ Value statement (why they should care)
- ✅ Unsubscribe link (footer)

### Audio/Product Previews:
- Include links to audio clips (YouTube, SoundCloud, embedded player if possible)
- Include BPM, key, mood, artist comparisons
- Include images/album art where relevant

### Social Proof:
- Use testimonials (real customer quotes)
- Mention bestsellers/popular products
- Show number of downloads/satisfied customers

### CTAs (Call-to-Action Examples)
- "Listen Now"
- "Download"
- "Get 20% Off"
- "Buy Now"
- "Claim Your Discount"
- "See Similar Beats"
- "Watch the Tutorial"
- "Download Your Files"

---

## OUTPUT FORMAT

For each template, provide:

```
Template Name: [clear identifier]
Journey: [which journey it belongs to]
Trigger: [when it sends]
Timing: [day/hours after trigger]

Subject Line: [compelling, 50-60 chars]
Preheader: [preview text]

Body:
[HTML-friendly markdown with sections]
[Include {{variables}} where applicable]
[Include [CTA BUTTON: Text]  where there should be a button]
[Include suggested discount codes if applicable]

Notes:
- [Optional tips for personalization or A/B testing]
```

---

## SPECIFIC REQUIREMENTS

1. **Write for HTML email** (use simple formatting, bold, bullets, line breaks)
2. **Make it scannable** (short paragraphs, bullets, section headers)
3. **Mobile-first** (short sentences, compact design)
4. **Include audio clips** (links to previews, not embedded)
5. **Professional but human** (not robotic, but not too casual)
6. **Clear CTAs** (1 primary action per email, always visible)
7. **Value first** (always give something before asking for a sale)
8. **Use {{variables}}** for personalization
9. **Include discount codes** where applicable
10. **Show social proof** (testimonials, stats, favorites)

---

## DELIVERABLE

12 complete email templates formatted ready to paste into the email builder:
1. Free Beat Onboarding Day 3
2. Free Kit Onboarding Day 3
3. Abandoned Checkout Reminder
4. Abandoned Checkout Scarcity
5. Browse Recovery Day 1
6. Browse Recovery Day 3
7. Rapper Tips Week 1 (Educational)
8. Producer Tips Week 1 (Behind-the-scenes)
9. Post-Beat Purchase Day 3 (Engagement)
10. Post-Beat Purchase Day 5 (Upgrade)
11. Kit Purchase Day 2 (Pairing)
12. Kit Purchase Day 7 (Arsenal)

Each template should be ready to copy-paste into an email editor, with personalization variables marked as `{{variable_name}}`.

---

## TONE/BRAND REFERENCE

- **Similar to:** Splice, Beatstars, Splice newsletters (professional music creators)
- **NOT like:** Spammy marketing emails
- **Voice:** Expert musician helping fellow creators succeed
- **Goal:** Build relationships, provide value, make sales feel natural

---

## QUESTIONS FOR CLAUDE

- Which emails would most benefit from video/audio embedded?
- Should discount codes be unique per email or vary by subscriber?
- Any subject line patterns that historically perform well in music/creator niche?
- Should we include tips/tutorials in emails, or just link to videos?
- Best way to handle the rotating weekly newsletters (different templates or variations)?

---

**Ready to write these 12 templates?**

Here's what you need:
- Context above ✅
- Example of your brand voice (provide a similar newsletter you've seen)
- Any specific artist styles or beat types you want mentioned (e.g., "Drake-type, Travis Scott vibes, Lo-fi chill")
- Discount codes or discount amounts to use
- Links to your social media, website, video tutorials (to link in emails)
