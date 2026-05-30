-- ================================================================
-- SWEETO SUPABASE MIGRATION — Add missing columns to live tables
-- ================================================================
-- Run this in Supabase > SQL Editor on your LIVE project.
-- This is safe: it only ADDS columns, does NOT drop or recreate tables.
-- ================================================================

-- ---------------------------------------------------------------
-- ORDERS TABLE: add new columns used by the Supabase checkout flow
-- ---------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_contact TEXT,
  ADD COLUMN IF NOT EXISTS items TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS total_items INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promo_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS city VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address TEXT;

-- Make customer_phone optional (it was NOT NULL before)
ALTER TABLE orders
  ALTER COLUMN customer_phone DROP NOT NULL;

-- ---------------------------------------------------------------
-- PRODUCTS TABLE: add new columns used by the app
-- ---------------------------------------------------------------
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS bought_price NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS colors TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS related_products TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS placements TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS condition VARCHAR(50) DEFAULT 'new';

-- ---------------------------------------------------------------
-- SHIPPING ZONES TABLE: already correct, no changes needed
-- ---------------------------------------------------------------

-- ---------------------------------------------------------------
-- VIDEO ADS TABLE: already correct, no changes needed  
-- ---------------------------------------------------------------

-- ---------------------------------------------------------------
-- SECTIONS TABLE: add missing columns for storefront section management
-- ---------------------------------------------------------------
ALTER TABLE sections
  ADD COLUMN IF NOT EXISTS is_dual INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS show_view_all INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_products INTEGER DEFAULT 8,
  ADD COLUMN IF NOT EXISTS header_style VARCHAR(255) DEFAULT 'gradient',
  ADD COLUMN IF NOT EXISTS header_image VARCHAR(255),
  ADD COLUMN IF NOT EXISTS category VARCHAR(255) DEFAULT 'All',
  ADD COLUMN IF NOT EXISTS role VARCHAR(255) DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS titleb VARCHAR(255),
  ADD COLUMN IF NOT EXISTS subtitleb VARCHAR(255),
  ADD COLUMN IF NOT EXISTS categoryb VARCHAR(255) DEFAULT 'All',
  ADD COLUMN IF NOT EXISTS roleb VARCHAR(255) DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS headerstyleb VARCHAR(255) DEFAULT 'bold',
  ADD COLUMN IF NOT EXISTS headerimageb VARCHAR(255);

-- ---------------------------------------------------------------
-- ENABLE REALTIME ON KEY TABLES
-- ---------------------------------------------------------------
-- Run this to enable real-time order notifications in the admin dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- Confirm migration success
SELECT 'Migration complete' AS status;
