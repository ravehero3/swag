import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase") || process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
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

      CREATE TABLE IF NOT EXISTS promo_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_percent INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL, -- 'dock_icon', 'carousel_desktop', 'carousel_mobile'
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

      INSERT INTO settings (key, value) VALUES 
        ('header_logo', '/uploads/artwork/voodoo808-logo.png'),
        ('beaty_video_main', '/uploads/artwork/voodoo808-video.mp4'),
        ('beaty_video_alt', '/uploads/hrad-na-web.mov')
      ON CONFLICT (key) DO NOTHING;
    `);
    
    // Add test data
    const beatCount = await client.query("SELECT COUNT(*) FROM beats");
    if (beatCount.rows[0].count === "0") {
      // Add 20 test beats
      const beatInserts = [];
      const tagSets = [
        "ARRAY['Trap', 'Dark', 'Hard']",
        "ARRAY['Hip-Hop', 'Smooth', 'Boom-Bap']",
        "ARRAY['Drill', 'Aggressive', 'Street']",
        "ARRAY['Chill', 'Lofi', 'Ambient']",
        "ARRAY['Electronic', 'Synth', 'Futuristic']",
        "ARRAY['Reggae', 'Dub', 'Roots']",
        "ARRAY['Jazz', 'Smooth', 'Uplifting']",
        "ARRAY['Rock', 'Heavy', 'Energetic']",
        "ARRAY['Pop', 'Catchy', 'Commercial']",
        "ARRAY['Soul', 'Soulful', 'Groovy']"
      ];
      
      for (let i = 1; i <= 20; i++) {
        const tags = tagSets[(i - 1) % tagSets.length];
        beatInserts.push(`
          ('Test Beat ${i}', 'VOODOO808', ${80 + i}, 'C', 5000, '/uploads/preview/beat${i}.mp3', '/uploads/beat${i}.wav', '/uploads/artwork/beat${i}.jpg', ${tags}, true, ${i === 1 ? 'true' : 'false'})
        `);
      }
      
      await client.query(`
        INSERT INTO beats (title, artist, bpm, key, price, preview_url, file_url, artwork_url, tags, is_published, is_highlighted) VALUES
        ${beatInserts.join(',')}
      `);
    }
    
    console.log("Database initialized successfully");
  } finally {
    client.release();
  }
}

export { pool };
