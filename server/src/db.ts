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
        file_url VARCHAR(500),
        artwork_url VARCHAR(500),
        legal_info TEXT,
        author_info TEXT,
        is_published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

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
        ('mixed', 'Beaty + Sound Kity + Zdarma (mix)', 'Platba přijata – Objednávka #{id} | VOODOO808', 'Objednávka #{id} ze dne {datum} je potvrzena. Níže najdete odkazy ke stažení všech zakoupených souborů. Každý odkaz je platný 30 dní.')
      ON CONFLICT (key) DO NOTHING;

      INSERT INTO settings (key, value) VALUES 
        ('header_logo', '/uploads/artwork/voodoo808-logo.png'),
        ('beaty_video_main', '/uploads/artwork/voodoo808-video.mp4'),
        ('beaty_video_alt', '/uploads/hrad-na-web.mov'),
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
        ('seo_zvuky_keywords', 'drum kit, zvuky pro producenty, one shot kit, loop kit, sample pack')
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

    // Safe column migrations — add any columns that may be missing from older deployments
    await client.query(`
      ALTER TABLE beats ADD COLUMN IF NOT EXISTS trackout_url VARCHAR(500);
      ALTER TABLE beats ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN DEFAULT FALSE;
      ALTER TABLE beats ADD COLUMN IF NOT EXISTS waveform_data JSONB;
      ALTER TABLE sound_kits ADD COLUMN IF NOT EXISTS legal_info TEXT;
      ALTER TABLE sound_kits ADD COLUMN IF NOT EXISTS author_info TEXT;
      ALTER TABLE sound_kits ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE;
      ALTER TABLE sound_kits ADD COLUMN IF NOT EXISTS number_of_sounds INTEGER DEFAULT 0;
      ALTER TABLE sound_kits ADD COLUMN IF NOT EXISTS preview_urls TEXT[] DEFAULT '{}';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_legal_name VARCHAR(255);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_artist_name VARCHAR(255);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_address TEXT;
      ALTER TABLE license_types ADD COLUMN IF NOT EXISTS contract_template TEXT;
    `);

    console.log("Database initialized successfully");
  } finally {
    client.release();
  }
}

export { pool };
