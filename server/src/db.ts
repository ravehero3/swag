import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
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
        file_url VARCHAR(500) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(beat_id, license_type_id)
      );
    `);
    
    // Add test data
    const beatCount = await client.query("SELECT COUNT(*) FROM beats");
    if (beatCount.rows[0].count === "0") {
      // Add 20 test beats
      const beatInserts = [];
      for (let i = 1; i <= 20; i++) {
        beatInserts.push(`
          ('Test Beat ${i}', 'VOODOO808', ${80 + i}, 'C', 5000, '/uploads/preview/beat${i}.mp3', '/uploads/beat${i}.wav', '/uploads/artwork/beat${i}.jpg', true, ${i === 1 ? 'true' : 'false'})
        `);
      }
      
      await client.query(`
        INSERT INTO beats (title, artist, bpm, key, price, preview_url, file_url, artwork_url, is_published, is_highlighted) VALUES
        ${beatInserts.join(',')}
      `);
    }
    
    console.log("Database initialized successfully");
  } finally {
    client.release();
  }
}

export { pool };
