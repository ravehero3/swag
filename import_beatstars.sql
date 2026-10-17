-- Import 5051 BeatStars customers in bulk
-- Source: audience_export_d2f83d6160 (subscribed users)

BEGIN;

-- Ensure tags exist
INSERT INTO tags (name, slug) VALUES 
  ('freebie', 'freebie'),
  ('beatstars', 'beatstars'),
  ('imported', 'imported'),
  ('subscribed', 'subscribed')
ON CONFLICT (slug) DO NOTHING;

-- Import all subscribed BeatStars customers (CSV converted to SQL values)
-- This COPY statement reads from stdin (will pipe CSV data)
\COPY subscribers (email, email_normalized, name, marketing_consent, marketing_consent_at, marketing_consent_source, first_source, created_at, updated_at) 
FROM STDIN WITH (FORMAT csv, HEADER true, DELIMITER ',')

-- Tag all imported subscribers
INSERT INTO subscriber_tags (subscriber_id, tag_id)
SELECT DISTINCT s.id, t.id 
FROM subscribers s, tags t
WHERE s.first_source = 'beatstars_free_download'
  AND t.slug IN ('freebie', 'beatstars', 'imported', 'subscribed')
ON CONFLICT DO NOTHING;

-- Get stats
SELECT COUNT(*) as total_beatstars FROM subscribers WHERE first_source = 'beatstars_free_download';

COMMIT;
