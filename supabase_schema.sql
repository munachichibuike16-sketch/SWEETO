-- ========================================================
-- SWEETO TECH LUXURY CONTROL CENTER - SUPABASE SCHEMAS
-- ========================================================

-- Disable constraints checks for initialization
SET session_replication_role = 'replica';

-- Drop existing tables if they exist
DROP TABLE IF EXISTS shipping_zones CASCADE;
DROP TABLE IF EXISTS video_ads CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS visitor_log CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Re-enable constraints checks
SET session_replication_role = 'origin';

-- 1. Categories Table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  icon VARCHAR(255),
  description TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Brands Table
CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Sections Table
CREATE TABLE sections (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255),
  subtitle VARCHAR(255),
  is_active INTEGER DEFAULT 1,
  position INTEGER DEFAULT 0,
  is_dual INTEGER DEFAULT 0,
  show_view_all INTEGER DEFAULT 1,
  max_products INTEGER DEFAULT 8,
  header_style VARCHAR(255) DEFAULT 'gradient',
  header_image VARCHAR(255),
  category VARCHAR(255) DEFAULT 'All',
  role VARCHAR(255) DEFAULT 'custom',
  titleB VARCHAR(255),
  subtitleB VARCHAR(255),
  categoryB VARCHAR(255) DEFAULT 'All',
  roleB VARCHAR(255),
  headerStyleB VARCHAR(255) DEFAULT 'bold',
  headerImageB VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Products Table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  original_price NUMERIC(12, 2),
  bought_price NUMERIC(12, 2) DEFAULT 0.00,  -- cost price for margin calc
  stock INTEGER DEFAULT 0,                    -- inventory quantity
  is_active INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  is_deal INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',        -- active / draft
  image_url TEXT,
  images TEXT DEFAULT '[]',                   -- JSON string of extra images
  colors TEXT DEFAULT '[]',                   -- JSON string of color variants
  category VARCHAR(255),
  brand VARCHAR(255),
  condition VARCHAR(50) DEFAULT 'new',
  placements TEXT DEFAULT '[]',              -- JSON string of active section keys
  related_products TEXT DEFAULT '[]',        -- JSON string of related product IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Orders Table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_contact TEXT,           -- "phone | address" format
  customer_phone VARCHAR(100),     -- legacy compat
  city VARCHAR(255),
  address TEXT,
  items TEXT DEFAULT '[]',         -- JSON string of cart items
  total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(12, 2),     -- alias for total
  total_items INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  promo_code VARCHAR(100),
  estimated_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Order Items Table
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  product_name VARCHAR(255),
  price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Visitor Log Table
CREATE TABLE visitor_log (
  id SERIAL PRIMARY KEY,
  ip VARCHAR(100),
  user_agent TEXT,
  page_path VARCHAR(255),
  country VARCHAR(50) DEFAULT 'Unknown',
  event_type VARCHAR(100) DEFAULT 'page_view',
  device_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Settings Table
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Reviews Table
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER,
  reviewer_name VARCHAR(255) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Video Ads Table
CREATE TABLE video_ads (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  video_url TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Shipping Zones Table
CREATE TABLE shipping_zones (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  est_days VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- INITIAL CORE DATA SEEDING
-- ========================================================

-- Seed Settings keys
INSERT INTO settings (key, value) VALUES 
('store_phone', ''),
('language', 'en'),
('admin_pin', ''),
('enable_maintenance', 'false'),
('hero_layout', 'grid'),
('about_story', ''),
('about_mission', ''),
('social_instagram', ''),
('social_facebook', ''),
('social_twitter', ''),
('social_whatsapp', ''),
('loc_address', ''),
('loc_city', 'Abidjan'),
('loc_country', 'Côte d''Ivoire'),
('loc_hours_weekday', '08:00 – 20:00'),
('loc_hours_sat', '09:00 – 18:00'),
('loc_hours_sun', 'Closed'),
('loc_map_embed', ''),
('policy_privacy', ''),
('policy_terms', '')
ON CONFLICT (key) DO NOTHING;
