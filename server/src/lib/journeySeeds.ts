/**
 * Journey Configuration - Defines all 11 customer journeys with complete email sequences
 * Use with POST /api/marketing/journeys/seed to auto-populate all journeys
 */

export interface JourneyStep {
  delay_hours: number;
  template_key: string;
  description: string;
}

export interface JourneyConfig {
  name: string;
  description: string;
  trigger_type: "beat_downloaded" | "kit_downloaded" | "beat_purchased" | "kit_purchased" | "cart_abandoned" | "product_viewed" | "newsletter_signup" | "inactive_90days";
  trigger_value?: string;
  steps: JourneyStep[];
}

export const JOURNEY_CONFIGS: JourneyConfig[] = [
  {
    name: "Free Beat Onboarding",
    description: "Convert free beat downloaders to paying customers over 30 days",
    trigger_type: "beat_downloaded",
    steps: [
      {
        delay_hours: 0,
        template_key: "free_beat_onboarding_day3",
        description: "Day 3: Free beat offer + FIRST20 discount (20% off)",
      },
      {
        delay_hours: 168, // 7 days
        template_key: "browse_recovery_day1",
        description: "Day 10: Retarget with similar vibe",
      },
      {
        delay_hours: 120, // 5 days
        template_key: "browse_recovery_day3",
        description: "Day 15: Recommend 3 trending beats",
      },
      {
        delay_hours: 240, // 10 days
        template_key: "producer_tips_sound_design",
        description: "Day 25: Value content - production tips",
      },
      {
        delay_hours: 120, // 5 days
        template_key: "abandoned_checkout_reminder",
        description: "Day 30: Final reminder if not purchased",
      },
      {
        delay_hours: 120, // 5 days
        template_key: "abandoned_checkout_scarcity",
        description: "Day 35: Last chance offer - 3 days to grab discount",
      },
    ],
  },
  {
    name: "Free Sound Kit Onboarding",
    description: "Convert free kit downloaders to paying customers over 30 days",
    trigger_type: "kit_downloaded",
    steps: [
      {
        delay_hours: 72, // 3 days
        template_key: "free_kit_onboarding_day3",
        description: "Day 3: Free kit offer + PRODUCER20 discount (20% off)",
      },
      {
        delay_hours: 168, // 7 days
        template_key: "producer_tips_sound_design",
        description: "Day 10: How I design exclusive sounds",
      },
      {
        delay_hours: 240, // 10 days
        template_key: "browse_recovery_day3",
        description: "Day 20: Recommend trending sound kits",
      },
      {
        delay_hours: 168, // 7 days
        template_key: "weekly_newsletter_new_drops",
        description: "Day 27: New releases this week",
      },
      {
        delay_hours: 168, // 7 days
        template_key: "kit_cross_sell",
        description: "Day 34: Final bundle offer - beats + kits combo",
      },
    ],
  },
  {
    name: "Post-Beat Purchase Upsell",
    description: "Maximize engagement after exclusive beat purchase - 45 day sequence",
    trigger_type: "beat_purchased",
    steps: [
      {
        delay_hours: 24, // 1 day
        template_key: "post_beat_purchase_engagement",
        description: "Day 1: Build community - ask what they recorded",
      },
      {
        delay_hours: 120, // 5 days
        template_key: "post_beat_purchase_custom_arrangement",
        description: "Day 6: Upsell custom arrangement service",
      },
      {
        delay_hours: 168, // 7 days
        template_key: "kit_cross_sell",
        description: "Day 13: Bundle recommend kit + CROSS50 (50% off)",
      },
      {
        delay_hours: 240, // 10 days
        template_key: "rapper_tips_spotify",
        description: "Day 23: Value content - Spotify strategy",
      },
      {
        delay_hours: 336, // 14 days
        template_key: "weekly_newsletter_new_drops",
        description: "Day 37: New releases available",
      },
      {
        delay_hours: 168, // 7 days
        template_key: "producer_tips_sound_design",
        description: "Day 44: Exclusive preset pack + sample collection",
      },
    ],
  },
  {
    name: "Post-Kit Purchase Engagement",
    description: "Build satisfaction and repeat purchases after kit purchase - 45 day sequence",
    trigger_type: "kit_purchased",
    steps: [
      {
        delay_hours: 48, // 2 days
        template_key: "producer_tips_sound_design",
        description: "Day 2: How to use these sounds in production",
      },
      {
        delay_hours: 192, // 8 days
        template_key: "kit_cross_sell",
        description: "Day 10: Complement with recommended kit + CROSS50",
      },
      {
        delay_hours: 288, // 12 days
        template_key: "browse_recovery_day3",
        description: "Day 22: Recommend trending beats to pair",
      },
      {
        delay_hours: 360, // 15 days
        template_key: "weekly_newsletter_new_drops",
        description: "Day 37: New drops available",
      },
      {
        delay_hours: 144, // 6 days
        template_key: "rapper_tips_spotify",
        description: "Day 43: Community showcase - show us what you made",
      },
    ],
  },
  {
    name: "Abandoned Checkout Recovery",
    description: "Recover lost sales from abandoned shopping carts - 7 day urgency sequence",
    trigger_type: "cart_abandoned",
    steps: [
      {
        delay_hours: 4, // 4 hours - strike hot
        template_key: "abandoned_checkout_reminder",
        description: "4 hrs: Gentle reminder - you left something",
      },
      {
        delay_hours: 48, // 2 days
        template_key: "abandoned_checkout_scarcity",
        description: "Day 2: 15% OFF - SAVE15 code, 24 hr urgency",
      },
      {
        delay_hours: 72, // 3 days
        template_key: "browse_recovery_day1",
        description: "Day 5: Stock running low - final push",
      },
    ],
  },
  {
    name: "Browse Abandonment Recovery",
    description: "Convert product browsers to buyers - 10 day sequence",
    trigger_type: "product_viewed",
    steps: [
      {
        delay_hours: 2, // 2 hours - while fresh
        template_key: "browse_recovery_day1",
        description: "2 hrs: That beat you were checking out...",
      },
      {
        delay_hours: 72, // 3 days
        template_key: "browse_recovery_day3",
        description: "Day 3: Similar recommendations",
      },
      {
        delay_hours: 120, // 5 days
        template_key: "abandoned_checkout_scarcity",
        description: "Day 8: Create urgency with SAVE15 (if viewed again)",
      },
      {
        delay_hours: 48, // 2 days
        template_key: "browse_recovery_day3",
        description: "Day 10: One more try - farewell offer",
      },
    ],
  },
  {
    name: "Rapper Growth & Tips Series",
    description: "Build authority and engage rappers - 60 day nurture sequence",
    trigger_type: "newsletter_signup",
    trigger_value: "rapper",
    steps: [
      {
        delay_hours: 0,
        template_key: "rapper_tips_spotify",
        description: "Day 0: Spotify playlist strategy guide",
      },
      {
        delay_hours: 336, // 14 days
        template_key: "educational_beat_breakdown",
        description: "Day 14: How to process drums like a pro",
      },
      {
        delay_hours: 336, // 14 days
        template_key: "browse_recovery_day3",
        description: "Day 28: Trending beats for rappers",
      },
      {
        delay_hours: 336, // 14 days
        template_key: "weekly_newsletter_new_drops",
        description: "Day 42: New drops this week",
      },
      {
        delay_hours: 336, // 14 days
        template_key: "kit_cross_sell",
        description: "Day 56: Bundle beats with pro sound kits",
      },
      {
        delay_hours: 96, // 4 days
        template_key: "rapper_tips_spotify",
        description: "Day 60: Advanced Spotify playlist submission strategy",
      },
    ],
  },
  {
    name: "Producer Growth & Tutorials Series",
    description: "Build authority for producers - 60 day nurture sequence",
    trigger_type: "newsletter_signup",
    trigger_value: "producer",
    steps: [
      {
        delay_hours: 0,
        template_key: "producer_tips_sound_design",
        description: "Day 0: How I design exclusive sounds",
      },
      {
        delay_hours: 336, // 14 days
        template_key: "producer_tips_sound_design",
        description: "Day 14: Advanced mixing techniques for professional sound",
      },
      {
        delay_hours: 336, // 14 days
        template_key: "bundle_recommendation",
        description: "Day 28: Get placement-ready sounds - bundle recommendation",
      },
      {
        delay_hours: 336, // 14 days
        template_key: "browse_recovery_day3",
        description: "Day 42: Trending kits and beats",
      },
      {
        delay_hours: 336, // 14 days
        template_key: "weekly_newsletter_new_drops",
        description: "Day 56: New exclusive sounds",
      },
      {
        delay_hours: 96, // 4 days
        template_key: "educational_beat_breakdown",
        description: "Day 60: Professional mixing/mastering checklist",
      },
    ],
  },
  {
    name: "Loyal Customer - Weekly Newsletter",
    description: "Ongoing engagement for repeat customers - send every 7 days",
    trigger_type: "beat_purchased", // Can be modified to require 2+ purchases
    steps: [
      {
        delay_hours: 0,
        template_key: "weekly_newsletter_new_drops",
        description: "Week 0: Subscribe to weekly drops",
      },
      {
        delay_hours: 168, // Repeating every 7 days
        template_key: "weekly_newsletter_new_drops",
        description: "Every 7 days: New releases",
      },
    ],
  },
  {
    name: "VIP Premium Subscriber Series",
    description: "Retention for high-value customers (5+ purchases or 5000+ CZK spent)",
    trigger_type: "beat_purchased", // Custom logic: 5+ purchases
    steps: [
      {
        delay_hours: 0,
        template_key: "producer_tips_sound_design",
        description: "Day 0: Welcome to VIP - premium benefits",
      },
      {
        delay_hours: 360, // 15 days
        template_key: "rapper_tips_spotify",
        description: "Day 15: Advanced distribution techniques",
      },
      {
        delay_hours: 360, // 15 days
        template_key: "browse_recovery_day3",
        description: "Day 30: VIP exclusive sounds",
      },
      {
        delay_hours: 336, // 14 days (repeating)
        template_key: "weekly_newsletter_new_drops",
        description: "Every 14 days: VIP early access to new drops",
      },
    ],
  },
  {
    name: "Re-engagement Campaign",
    description: "Win back inactive customers (90+ days without purchase)",
    trigger_type: "inactive_90days",
    steps: [
      {
        delay_hours: 0,
        template_key: "browse_recovery_day1",
        description: "Day 0: Fresh drops since you were here",
      },
      {
        delay_hours: 168, // 7 days
        template_key: "browse_recovery_day3",
        description: "Day 7: Top 3 most popular this month",
      },
      {
        delay_hours: 168, // 7 days
        template_key: "abandoned_checkout_scarcity",
        description: "Day 14: 20% OFF - COMEBACK20 code",
      },
      {
        delay_hours: 168, // 7 days
        template_key: "producer_tips_sound_design",
        description: "Day 21: New capabilities showcase",
      },
      {
        delay_hours: 168, // 7 days
        template_key: "abandoned_checkout_scarcity",
        description: "Day 28: Final welcome back - biggest discount 30% OFF",
      },
    ],
  },
];

export default JOURNEY_CONFIGS;
