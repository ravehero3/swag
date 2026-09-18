-- Fix: Add audience values to all existing templates
-- Run this SQL directly in your PostgreSQL client

UPDATE marketing_templates SET audience = 'general' WHERE key = 'free_beat_onboarding_day3';
UPDATE marketing_templates SET audience = 'general' WHERE key = 'free_kit_onboarding_day3';
UPDATE marketing_templates SET audience = 'general' WHERE key = 'abandoned_checkout_reminder';
UPDATE marketing_templates SET audience = 'general' WHERE key = 'abandoned_checkout_scarcity';
UPDATE marketing_templates SET audience = 'general' WHERE key = 'browse_recovery_day1';
UPDATE marketing_templates SET audience = 'general' WHERE key = 'browse_recovery_day3';

UPDATE marketing_templates SET audience = 'rapper' WHERE key = 'rapper_tips_spotify';
UPDATE marketing_templates SET audience = 'producer' WHERE key = 'producer_tips_sound_design';

UPDATE marketing_templates SET audience = 'general' WHERE key = 'post_beat_purchase_engagement';
UPDATE marketing_templates SET audience = 'general' WHERE key = 'post_beat_purchase_custom_arrangement';
UPDATE marketing_templates SET audience = 'general' WHERE key = 'kit_cross_sell';
UPDATE marketing_templates SET audience = 'general' WHERE key = 'weekly_newsletter_new_drops';
UPDATE marketing_templates SET audience = 'general' WHERE key = 'first_purchase_thank_you';
UPDATE marketing_templates SET audience = 'general' WHERE key = 'bundle_recommendation';

UPDATE marketing_templates SET audience = 'producer' WHERE key = 'educational_beat_breakdown';
UPDATE marketing_templates SET audience = 'general' WHERE key = 'collaboration_remix';
UPDATE marketing_templates SET audience = 'general' WHERE key = 'vip_upgrade_offer';

UPDATE marketing_templates SET audience = 'rapper' WHERE key = 'rapper_feature_collab';

-- Verify the updates
SELECT key, audience FROM marketing_templates ORDER BY key;
