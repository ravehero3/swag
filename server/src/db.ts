import pg from "pg";

function getDatabaseConfig() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return {
      connectionString: undefined,
      connectionTimeoutMillis: 15000,
    };
  }

  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1") || connectionString.includes("helium");

  return {
    connectionString,
    connectionTimeoutMillis: 15000,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    // Disable prepared statements for pgBouncer transaction mode compatibility
    statement_timeout: 30000,
  };
}

const config = getDatabaseConfig();

const isServerless = process.env.NODE_ENV === "production";
const maxDbClients = isServerless ? 1 : Number(process.env.DB_MAX_CLIENTS || 10);
const pool = new pg.Pool({
  ...config,
  max: maxDbClients,
  idleTimeoutMillis: isServerless ? 5000 : 30000,
  connectionTimeoutMillis: 20000,
});

pool.on('error', (err) => {
  console.error('Database pool error (non-fatal):', err.message);
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS beats (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) DEFAULT 'VOODOO808',
        bpm INTEGER,
        key VARCHAR(50),
        price DECIMAL(10, 2) NOT NULL,
        preview_url VARCHAR(500),
        file_url VARCHAR(500),
        artwork_url VARCHAR(500),
        trackout_url VARCHAR(500),
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        is_published BOOLEAN DEFAULT FALSE,
        is_highlighted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS saved_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        item_id INTEGER NOT NULL,
        item_type VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, item_id, item_type)
      );

      CREATE TABLE IF NOT EXISTS sound_kits (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) DEFAULT 0,
        is_free BOOLEAN DEFAULT FALSE,
        number_of_sounds INTEGER DEFAULT 0,
        tags TEXT[],
        preview_url VARCHAR(500),
        preview_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
        file_url VARCHAR(500),
        artwork_url VARCHAR(500),
        legal_info TEXT,
        author_info TEXT,
        is_published BOOLEAN DEFAULT FALSE,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE sound_kits ADD COLUMN IF NOT EXISTS preview_labels TEXT[] DEFAULT ARRAY[]::TEXT[];
      ALTER TABLE sound_kits ADD COLUMN IF NOT EXISTS extra_artwork_urls TEXT[] DEFAULT ARRAY[]::TEXT[];

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        email VARCHAR(255) NOT NULL,
        items JSONB NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        PRIMARY KEY (sid)
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON session ("expire");

      CREATE TABLE IF NOT EXISTS license_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        file_types TEXT[] NOT NULL,
        terms_text TEXT,
        is_negotiable BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS beat_license_files (
        id SERIAL PRIMARY KEY,
        beat_id INTEGER REFERENCES beats(id) ON DELETE CASCADE,
        license_type_id INTEGER REFERENCES license_types(id) ON DELETE CASCADE,
        file_url TEXT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(beat_id, license_type_id)
      );

      CREATE TABLE IF NOT EXISTS pending_uploads (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL,
        bucket TEXT NOT NULL,
        filename TEXT NOT NULL,
        size BIGINT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        linked BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS promo_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_percent INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        url TEXT NOT NULL,
        title VARCHAR(255),
        link VARCHAR(500),
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        subject TEXT NOT NULL,
        intro_text TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO email_templates (key, name, subject, intro_text) VALUES
        ('beat_single', 'Beat – 1 kus', 'Platba přijata – Objednávka #{id} | VOODOO808', 'Objednávka #{id} ze dne {datum} je potvrzena. Níže najdete odkaz ke stažení vašeho beatu. Odkaz je platný 30 dní.'),
        ('beats_multiple', 'Beaty – více kusů', 'Platba přijata – Objednávka #{id} | VOODOO808', 'Objednávka #{id} ze dne {datum} je potvrzena. Níže najdete odkazy ke stažení vašich beatů. Každý odkaz je platný 30 dní.'),
        ('kit_single', 'Sound Kit – 1 kus', 'Platba přijata – Objednávka #{id} | VOODOO808', 'Objednávka #{id} ze dne {datum} je potvrzena. Níže najdete odkaz ke stažení vašeho sound kitu. Odkaz je platný 30 dní.'),
        ('kits_multiple', 'Sound Kity – více kusů', 'Platba přijata – Objednávka #{id} | VOODOO808', 'Objednávka #{id} ze dne {datum} je potvrzena. Níže najdete odkazy ke stažení vašich sound kitů. Každý odkaz je platný 30 dní.'),
        ('free_download', 'Stažení zdarma', 'Vaše soubory zdarma – VOODOO808', 'Děkujeme za zájem! Níže najdete přímé odkazy ke stažení vašich souborů. Soubory jsou také dostupné ve vašem účtu.'),
        ('mixed', 'Beaty + Sound Kity + Zdarma (mix)', 'Platba přijata – Objednávka #{id} | VOODOO808', 'Objednávka #{id} ze dne {datum} je potvrzena. Níže najdete odkazy ke stažení všech zakoupených souborů. Každý odkaz je platný 30 dní.'),
        ('bank_transfer_reminder', 'Připomínka – bankovní převod', 'Připomínka: Vaše objednávka #{id} čeká na platbu | VOODOO808', 'Připomínáme, že vaše objednávka #{id} stále čeká na přijetí platby bankovním převodem. Níže znovu uvádíme platební údaje. Pokud jste platbu již odeslali, tento email ignorujte.')
      ON CONFLICT (key) DO NOTHING;

      INSERT INTO settings (key, value) VALUES 
        ('header_logo', '/uploads/artwork/voodoo808-logo.png'),
        ('beaty_video_main', '/uploads/artwork/voodoo808-video.mp4'),
        ('beaty_video_alt', '/uploads/hrad-na-web.mov'),
        ('zvuky_video', '/uploads/hrad-na-web.mov'),
        ('seo_site_name', 'VOODOO808'),
        ('seo_og_image', ''),
        ('seo_home_title', 'VOODOO808 – Beaty a Zvuky pro Hudební Producenty'),
        ('seo_home_description', 'Nakupte exkluzivní beaty a zvukové sady pro tvorbu hudby. VOODOO808 nabízí prémiové drum kity a beaty pro české hudební producenty.'),
        ('seo_home_keywords', 'beaty, zvuky, drum kit, hudební producenti, tvorba hudby, VOODOO808'),
        ('seo_beaty_title', 'Beaty – VOODOO808 | Kup Beat Online'),
        ('seo_beaty_description', 'Prohlédni si katalog beatů. Stáhni prémiové beaty pro tvorbu hudby. Licence na míru každému producentovi.'),
        ('seo_beaty_keywords', 'koupit beat, beaty online, trap beaty, hip hop beaty, český beat'),
        ('seo_zvuky_title', 'Zvuky & Drum Kity – VOODOO808'),
        ('seo_zvuky_description', 'Prémiové zvukové sady a drum kity pro hudební producenty. One-shot sady, loop kity a více – vše ke stažení.'),
        ('seo_zvuky_keywords', 'drum kit, zvuky pro producenty, one shot kit, loop kit, sample pack'),
        ('ig_story_bg_color', '#000000'),
        ('ig_story_text_color', '#ffffff'),
        ('ig_story_accent_color', '#aaaaaa'),
        ('ig_story_overlay_opacity', '0.45'),
        ('ig_story_tagline', ''),
        ('ig_story_listening_text', 'právě poslouchám'),
        ('ig_story_website_text', 'NA VOODOO808.COM'),
        ('hero_logo', '/uploads/artwork/voodoo808-main-logo.png'),
        ('ig_story_logo_url', ''),
        ('ig_story_logo_placement', 'top-center'),
        ('ig_story_logo_y', '0'),
        ('ig_story_listening_y', '0'),
        ('ig_story_title_y', '0'),
        ('ig_story_website_y', '0'),
        ('ig_story_card_show', 'true'),
        ('ig_story_card_radius', '24'),
        ('ig_story_card_blur', '14'),
        ('ig_story_card_brightness', '0.18'),
        ('ig_story_card_shadow', 'true'),
        ('ig_story_card_shadow_amount', '24'),
        ('ig_story_card_padding', '16'),
        ('special_offer_enabled', 'false'),
        ('special_offer_percentage', '15'),
        ('special_offer_text', 'Sleva 15 % na vše pro hudební producenty'),
        ('special_offer_duration_minutes', '45')
      ON CONFLICT (key) DO NOTHING;
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        items JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
      CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);
    `);

    // Performance indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_beats_is_published ON beats (is_published);
      CREATE INDEX IF NOT EXISTS idx_beats_is_highlighted ON beats (is_highlighted);
      CREATE INDEX IF NOT EXISTS idx_beats_created_at ON beats (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sound_kits_is_published ON sound_kits (is_published);
      CREATE INDEX IF NOT EXISTS idx_sound_kits_created_at ON sound_kits (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items (user_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS beat_comments (
        id SERIAL PRIMARY KEY,
        beat_id INTEGER REFERENCES beats(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_beat_comments_beat_id ON beat_comments (beat_id);
    `);

    // Safe column migrations — add any columns that may be missing from older deployments
    await client.query(`
      ALTER TABLE beats ADD COLUMN IF NOT EXISTS trackout_url VARCHAR(500);
      ALTER TABLE beats ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN DEFAULT FALSE;
      ALTER TABLE beats ADD COLUMN IF NOT EXISTS waveform_data JSONB;
      ALTER TABLE beats ADD COLUMN IF NOT EXISTS play_count INTEGER DEFAULT 0;
      ALTER TABLE beats ADD COLUMN IF NOT EXISTS exclusive_sold BOOLEAN DEFAULT FALSE;
      ALTER TABLE beats ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
      ALTER TABLE beats ALTER COLUMN order_index SET DEFAULT 0;
      UPDATE beats SET order_index = 0 WHERE order_index IS NULL;
      ALTER TABLE sound_kits ADD COLUMN IF NOT EXISTS legal_info TEXT;
      ALTER TABLE sound_kits ADD COLUMN IF NOT EXISTS author_info TEXT;
      ALTER TABLE sound_kits ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE;
      ALTER TABLE sound_kits ADD COLUMN IF NOT EXISTS number_of_sounds INTEGER DEFAULT 0;
      ALTER TABLE sound_kits ADD COLUMN IF NOT EXISTS preview_urls TEXT[] DEFAULT '{}';
      ALTER TABLE sound_kits ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
      ALTER TABLE sound_kits ADD COLUMN IF NOT EXISTS waveform_data JSONB;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_legal_name VARCHAR(255);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_artist_name VARCHAR(255);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_address TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'gopay';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS abandoned_email_sent BOOLEAN DEFAULT FALSE;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS gopay_payment_id BIGINT;
      ALTER TABLE license_types ADD COLUMN IF NOT EXISTS contract_template TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;
      ALTER TABLE beat_comments ADD COLUMN IF NOT EXISTS time_offset NUMERIC DEFAULT 0;
      ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
    `);

    await client.query(`
      UPDATE settings
      SET value = 'Sleva 15 % na vše pro hudební producenty'
      WHERE key = 'special_offer_text'
        AND value = 'SPECIÁLNÍ AKCE! Omezená nabídka končí za chvíli. Využijte slevový kód:';
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id SERIAL PRIMARY KEY,
        path VARCHAR(500) NOT NULL,
        session_id VARCHAR(100),
        referrer VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views (path);
      CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views (session_id);
    `);

    // ─────────────────────────────────────────────────────────────────────
    // Marketing automation schema (subscribers, tags, journeys, campaigns).
    // Additive only — does not touch/rename the existing `leads` table.
    // ─────────────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        email_normalized VARCHAR(255) NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(255),
        first_source VARCHAR(100) DEFAULT 'unknown',
        first_freebie VARCHAR(255),
        utm_source VARCHAR(255),
        utm_medium VARCHAR(255),
        utm_campaign VARCHAR(255),
        utm_content VARCHAR(255),
        utm_term VARCHAR(255),
        marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
        marketing_consent_at TIMESTAMP,
        marketing_consent_source VARCHAR(100),
        unsubscribed_at TIMESTAMP,
        unsubscribe_reason TEXT,
        suppressed_at TIMESTAMP,
        suppressed_reason TEXT,
        is_buyer BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_email_normalized ON subscribers (email_normalized);
      CREATE INDEX IF NOT EXISTS idx_subscribers_consent ON subscribers (marketing_consent, unsubscribed_at, suppressed_at);
      CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON subscribers (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers (user_id);

      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS subscriber_tags (
        subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (subscriber_id, tag_id)
      );
      CREATE INDEX IF NOT EXISTS idx_subscriber_tags_tag_id ON subscriber_tags (tag_id);

      CREATE TABLE IF NOT EXISTS subscriber_freebies (
        id SERIAL PRIMARY KEY,
        subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
        product_title VARCHAR(255),
        product_type VARCHAR(50),
        product_id INTEGER,
        source VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_subscriber_freebies_subscriber_id ON subscriber_freebies (subscriber_id);

      CREATE TABLE IF NOT EXISTS marketing_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        key VARCHAR(100) UNIQUE,
        subject TEXT NOT NULL,
        preheader TEXT,
        html_content TEXT NOT NULL,
        text_content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS marketing_journeys (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        trigger_type VARCHAR(50) NOT NULL,
        trigger_value VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_marketing_journeys_trigger ON marketing_journeys (trigger_type, status);

      CREATE TABLE IF NOT EXISTS marketing_journey_steps (
        id SERIAL PRIMARY KEY,
        journey_id INTEGER NOT NULL REFERENCES marketing_journeys(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        step_type VARCHAR(20) NOT NULL,
        delay_hours INTEGER NOT NULL DEFAULT 0,
        template_id INTEGER REFERENCES marketing_templates(id) ON DELETE SET NULL,
        configuration JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_marketing_journey_steps_journey_id ON marketing_journey_steps (journey_id, position);

      CREATE TABLE IF NOT EXISTS marketing_enrollments (
        id SERIAL PRIMARY KEY,
        subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
        journey_id INTEGER NOT NULL REFERENCES marketing_journeys(id) ON DELETE CASCADE,
        journey_version INTEGER NOT NULL DEFAULT 1,
        current_step_id INTEGER REFERENCES marketing_journey_steps(id) ON DELETE SET NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        next_run_at TIMESTAMP,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        last_error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(subscriber_id, journey_id)
      );
      CREATE INDEX IF NOT EXISTS idx_marketing_enrollments_due ON marketing_enrollments (status, next_run_at);
      CREATE INDEX IF NOT EXISTS idx_marketing_enrollments_subscriber ON marketing_enrollments (subscriber_id);
      CREATE INDEX IF NOT EXISTS idx_marketing_enrollments_journey ON marketing_enrollments (journey_id);

      CREATE TABLE IF NOT EXISTS marketing_segments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        filter_type VARCHAR(50) NOT NULL,
        filter_value VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS marketing_campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subject TEXT,
        template_id INTEGER REFERENCES marketing_templates(id) ON DELETE SET NULL,
        segment_id INTEGER REFERENCES marketing_segments(id) ON DELETE SET NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        scheduled_at TIMESTAMP,
        sent_at TIMESTAMP,
        recipient_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns (status, scheduled_at);

      CREATE TABLE IF NOT EXISTS marketing_email_sends (
        id SERIAL PRIMARY KEY,
        subscriber_id INTEGER REFERENCES subscribers(id) ON DELETE SET NULL,
        journey_id INTEGER REFERENCES marketing_journeys(id) ON DELETE SET NULL,
        journey_step_id INTEGER REFERENCES marketing_journey_steps(id) ON DELETE SET NULL,
        enrollment_id INTEGER REFERENCES marketing_enrollments(id) ON DELETE SET NULL,
        campaign_id INTEGER REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
        template_id INTEGER REFERENCES marketing_templates(id) ON DELETE SET NULL,
        resend_email_id VARCHAR(255),
        idempotency_key VARCHAR(255) NOT NULL UNIQUE,
        email_type VARCHAR(20) NOT NULL DEFAULT 'marketing',
        subject TEXT,
        recipient VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'queued',
        error TEXT,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_marketing_email_sends_subscriber ON marketing_email_sends (subscriber_id);
      CREATE INDEX IF NOT EXISTS idx_marketing_email_sends_resend_id ON marketing_email_sends (resend_email_id);
      CREATE INDEX IF NOT EXISTS idx_marketing_email_sends_status ON marketing_email_sends (status);
      CREATE INDEX IF NOT EXISTS idx_marketing_email_sends_campaign ON marketing_email_sends (campaign_id);

      CREATE TABLE IF NOT EXISTS marketing_email_events (
        id SERIAL PRIMARY KEY,
        email_send_id INTEGER REFERENCES marketing_email_sends(id) ON DELETE CASCADE,
        subscriber_id INTEGER REFERENCES subscribers(id) ON DELETE SET NULL,
        resend_email_id VARCHAR(255),
        event_type VARCHAR(50) NOT NULL,
        event_id VARCHAR(255),
        event_timestamp TIMESTAMP,
        payload JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_marketing_email_events_send_id ON marketing_email_events (email_send_id);
      CREATE INDEX IF NOT EXISTS idx_marketing_email_events_created_at ON marketing_email_events (created_at DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_marketing_email_events_event_id ON marketing_email_events (event_id) WHERE event_id IS NOT NULL;

      CREATE TABLE IF NOT EXISTS marketing_audit_log (
        id SERIAL PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        target_type VARCHAR(50),
        target_id INTEGER,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_marketing_audit_log_created_at ON marketing_audit_log (created_at DESC);
    `);

    // Backfill: normalise emails for any subscriber rows that predate the
    // email_normalized column (safe no-op on fresh installs).
    await client.query(`
      UPDATE subscribers SET email_normalized = LOWER(TRIM(email)) WHERE email_normalized IS NULL OR email_normalized = '';
    `);

    // Seed default marketing settings (test mode ON by default — never send
    // real marketing email to the historical list until an admin flips this).
    await client.query(`
      INSERT INTO settings (key, value) VALUES
        ('marketing_email_mode', 'test'),
        ('marketing_test_recipients', '')
      ON CONFLICT (key) DO NOTHING;
    `);

    // Seed example templates + journeys, ALL in 'draft' status. Per spec §50/51/52
    // and §53 ("do not automatically enroll every historical lead into a new
    // aggressive sequence") — these ship inactive; an admin must explicitly
    // review the steps and flip status to 'active' in Marketing → Journeys.
    const seedTemplates: Array<{ key: string; name: string; subject: string; html: string }> = [
      {
        key: "welcome_intro",
        name: "Vítejte u VOODOO808",
        subject: "Vítejte u VOODOO808, {{first_name}}!",
        html: `<div style="font-family:sans-serif;color:#eee;background:#0a0a0a;padding:32px;"><h1 style="color:#fff;">Vítejte!</h1><p>Díky, že jste se připojili k VOODOO808. Brzy vám zašleme tipy pro producenty a nové beaty.</p><p><a href="{{site_url}}" style="color:#0B99FC;">Prohlédnout beaty</a></p></div>`,
      },
      {
        key: "producer_tip_1",
        name: "Tip pro producenty",
        subject: "Tip: jak dát vašim 808kám víc šťávy",
        html: `<div style="font-family:sans-serif;color:#eee;background:#0a0a0a;padding:32px;"><h1 style="color:#fff;">Rýchlý tip</h1><p>Zkuste vrstvit dvě 808ky s různým laděním pro plnější základ tracku.</p></div>`,
      },
      {
        key: "freebie_delivery",
        name: "Zdarma soubor — doručení",
        subject: "Vaše soubory zdarma jsou připraveny",
        html: `<div style="font-family:sans-serif;color:#eee;background:#0a0a0a;padding:32px;"><h1 style="color:#fff;">Díky za stáhnutí!</h1><p>Doufáme, že se vám bude líbit. Podívejte se na další beaty a zvuky na našem webu.</p><p><a href="{{site_url}}" style="color:#0B99FC;">Prozkoumat VOODOO808</a></p></div>`,
      },
      {
        key: "freebie_offer",
        name: "Zdarma → nabídka",
        subject: "Připraveni na další krok?",
        html: `<div style="font-family:sans-serif;color:#eee;background:#0a0a0a;padding:32px;"><h1 style="color:#fff;">Ochutnávka nestačí?</h1><p>Podívejte se na naše nejnovější beaty a sound kity — vybráno přímo pro producenty jako vy.</p><p><a href="{{site_url}}/beaty" style="color:#0B99FC;">Zobrazit beaty</a></p></div>`,
      },
      {
        key: "post_purchase_thanks",
        name: "Po nákupu — poděkování",
        subject: "Děkujeme za nákup u VOODOO808!",
        html: `<div style="font-family:sans-serif;color:#eee;background:#0a0a0a;padding:32px;"><h1 style="color:#fff;">Děkujeme!</h1><p>Vážíme si vaší důvěry. Pokud budete mít jakékoliv otázky k licenci nebo souboru, napište nám.</p></div>`,
      },
    ];

    for (const t of seedTemplates) {
      await client.query(
        `INSERT INTO marketing_templates (key, name, subject, html_content) VALUES ($1,$2,$3,$4)
         ON CONFLICT (key) DO NOTHING`,
        [t.key, t.name, t.subject, t.html]
      );
    }

    const journeySeeds = [
      {
        name: "Welcome sekvence",
        description: "Obecná uvítácí sekvence pro nově přihlášené odběratele (bez konkrétního freebie).",
        triggerType: "subscriber_created",
        triggerValue: null as string | null,
        steps: [
          { type: "email", delay: 0, templateKey: "welcome_intro" },
          { type: "wait", delay: 72 },
          { type: "email", delay: 0, templateKey: "producer_tip_1" },
        ],
      },
      {
        name: "Free 808 Kit následná sekvence",
        description: "Sekvence po stáhnutí zdarma souboru: doručení → tip → nabídka (přeskočí nabídku, pokud už koupil).",
        triggerType: "freebie_downloaded",
        triggerValue: null as string | null,
        steps: [
          { type: "email", delay: 0, templateKey: "freebie_delivery" },
          { type: "wait", delay: 72 },
          { type: "email", delay: 0, templateKey: "producer_tip_1" },
          { type: "wait", delay: 96 },
          { type: "condition", delay: 0, condition: "has_purchased", onTrue: "end", onFalse: "continue" },
          { type: "email", delay: 0, templateKey: "freebie_offer" },
        ],
      },
      {
        name: "Po nákupu (draft)",
        description: "Draft sekvence po dokončené objednávce — poděkování a následný obsah. Zůstává v draft, dokud ji admin vědomě neaktivuje.",
        triggerType: "order_completed",
        triggerValue: null as string | null,
        steps: [
          { type: "email", delay: 0, templateKey: "post_purchase_thanks" },
        ],
      },
    ];

    for (const j of journeySeeds) {
      const existing = await client.query("SELECT id FROM marketing_journeys WHERE name = $1", [j.name]);
      if (existing.rows.length > 0) continue; // already seeded on a previous boot

      const journeyRes = await client.query(
        `INSERT INTO marketing_journeys (name, description, trigger_type, trigger_value, status)
         VALUES ($1,$2,$3,$4,'draft') RETURNING id`,
        [j.name, j.description, j.triggerType, j.triggerValue]
      );
      const journeyId = journeyRes.rows[0].id;

      let position = 1;
      for (const step of j.steps as any[]) {
        let templateId: number | null = null;
        if (step.templateKey) {
          const tmplRes = await client.query("SELECT id FROM marketing_templates WHERE key = $1", [step.templateKey]);
          templateId = tmplRes.rows[0]?.id || null;
        }
        const configuration = step.type === "condition"
          ? { condition: step.condition, onTrue: step.onTrue, onFalse: step.onFalse }
          : {};
        await client.query(
          `INSERT INTO marketing_journey_steps (journey_id, position, step_type, delay_hours, template_id, configuration)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [journeyId, position, step.type, step.delay, templateId, JSON.stringify(configuration)]
        );
        position++;
      }
    }

    console.log("Database initialized successfully");
  } finally {
    client.release();
  }
}

export { pool };
