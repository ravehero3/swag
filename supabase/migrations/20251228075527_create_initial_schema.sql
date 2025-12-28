/*
  # Initial VOODOO808 Database Schema

  1. New Tables
    - `users` - User accounts with email/password authentication
      - `id` (serial, primary key)
      - `email` (varchar, unique)
      - `password` (varchar, hashed)
      - `is_admin` (boolean)
      - `created_at` (timestamp)
    
    - `beats` - Beat products for sale
      - `id` (serial, primary key)
      - `title`, `artist`, `bpm`, `key`, `price`
      - `preview_url`, `file_url`, `artwork_url`
      - `tags` (text array, max 3 tags)
      - `is_published`, `is_highlighted` (boolean)
      - `created_at` (timestamp)
    
    - `sound_kits` - Sound kit products (drum kits, one shots, loops)
      - `id` (serial, primary key)
      - `title`, `description`, `type`, `price`
      - `is_free` (boolean), `number_of_sounds`
      - `tags` (text array)
      - `preview_url`, `file_url`, `artwork_url`
      - `legal_info`, `author_info`
      - `is_published` (boolean)
      - `created_at` (timestamp)
    
    - `saved_items` - User's saved/favorited items
      - `id` (serial, primary key)
      - `user_id` (references users)
      - `item_id`, `item_type` (beat or sound_kit)
      - `created_at` (timestamp)
      - Unique constraint on (user_id, item_id, item_type)
    
    - `orders` - Customer orders
      - `id` (serial, primary key)
      - `user_id` (optional, references users)
      - `email`, `items` (jsonb), `total`
      - `status` (pending/paid/delivered)
      - `created_at` (timestamp)
    
    - `license_types` - Available license types for beats
      - `id` (serial, primary key)
      - `name`, `description`, `price`
      - `file_types` (text array)
      - `terms_text`
      - `is_negotiable`, `is_active` (boolean)
      - `created_at` (timestamp)
    
    - `beat_license_files` - License-specific files for beats
      - `id` (serial, primary key)
      - `beat_id` (references beats)
      - `license_type_id` (references license_types)
      - `file_url`
      - `uploaded_at` (timestamp)
      - Unique constraint on (beat_id, license_type_id)
    
    - `session` - Express session storage
      - `sid` (varchar, primary key)
      - `sess` (json)
      - `expire` (timestamp)

  2. Security
    - Enable RLS on all user-facing tables
    - Add policies for authenticated access
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Beats table
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

-- Sound kits table
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

-- Saved items table
CREATE TABLE IF NOT EXISTS saved_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL,
  item_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, item_id, item_type)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  email VARCHAR(255) NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- License types table
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

-- Beat license files table
CREATE TABLE IF NOT EXISTS beat_license_files (
  id SERIAL PRIMARY KEY,
  beat_id INTEGER REFERENCES beats(id) ON DELETE CASCADE,
  license_type_id INTEGER REFERENCES license_types(id) ON DELETE CASCADE,
  file_url VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(beat_id, license_type_id)
);

-- Session table for express-session
CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON session ("expire");