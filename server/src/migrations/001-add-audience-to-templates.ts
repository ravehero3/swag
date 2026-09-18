import { pool } from "../db.js";

/**
 * Migration: Add audience values to all existing templates
 * Maps template keys to their intended audience
 */

const AUDIENCE_MAP: Record<string, "rapper" | "producer" | "general"> = {
  "free_beat_onboarding_day3": "general",
  "free_kit_onboarding_day3": "general",
  "abandoned_checkout_reminder": "general",
  "abandoned_checkout_scarcity": "general",
  "browse_recovery_day1": "general",
  "browse_recovery_day3": "general",
  "rapper_tips_spotify": "rapper",
  "producer_tips_sound_design": "producer",
  "post_beat_purchase_engagement": "general",
  "post_beat_purchase_custom_arrangement": "general",
  "kit_cross_sell": "general",
  "weekly_newsletter_new_drops": "general",
  "first_purchase_thank_you": "general",
  "bundle_recommendation": "general",
  "educational_beat_breakdown": "producer",
  "collaboration_remix": "general",
  "vip_upgrade_offer": "general",
  "rapper_feature_collab": "rapper",
};

async function migrateAudience() {
  try {
    console.log("📝 Starting audience migration...");
    
    let updated = 0;
    
    for (const [key, audience] of Object.entries(AUDIENCE_MAP)) {
      const result = await pool.query(
        "UPDATE marketing_templates SET audience = $1 WHERE key = $2 RETURNING id",
        [audience, key]
      );
      
      if (result.rows.length > 0) {
        updated++;
        console.log(`✅ ${key} → ${audience}`);
      } else {
        console.log(`⚠️ ${key} not found`);
      }
    }
    
    console.log(`\n✅ Migration complete! Updated ${updated} templates`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrateAudience();
