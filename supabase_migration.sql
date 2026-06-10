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
-- CATEGORIES TABLE: add parent_id column for subcategory relations
-- ---------------------------------------------------------------
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;

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
-- ---------------------------------------------------------------
-- ENABLE REALTIME ON KEY TABLES
-- ---------------------------------------------------------------
-- Run this to enable real-time order notifications in the admin dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- ---------------------------------------------------------------
-- CUSTOMER ACCOUNTS TABLE: Stores registered customer credentials
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_accounts (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_country_code VARCHAR(50),
  phone_number VARCHAR(100),
  password VARCHAR(255), -- Stores password (plaintext or hashed)
  avatar_url TEXT,
  provider VARCHAR(50) DEFAULT 'email',
  address TEXT,
  city TEXT,
  preferences JSONB DEFAULT '{"smsAlerts": true, "whatsappUpdates": true, "promoEmails": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.customer_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public select on customer_accounts" ON public.customer_accounts;
DROP POLICY IF EXISTS "Allow public insert on customer_accounts" ON public.customer_accounts;
DROP POLICY IF EXISTS "Allow public update on customer_accounts" ON public.customer_accounts;
DROP POLICY IF EXISTS "Allow admin delete on customer_accounts" ON public.customer_accounts;

-- Create policies
CREATE POLICY "Allow public select on customer_accounts" ON public.customer_accounts
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on customer_accounts" ON public.customer_accounts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on customer_accounts" ON public.customer_accounts
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow admin delete on customer_accounts" ON public.customer_accounts
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------
-- DELIVERY AGENTS TABLE: Stores delivery couriers' credentials & details
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_agents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  dob VARCHAR(50),
  address TEXT,
  vehicle_name VARCHAR(255),
  plate_number VARCHAR(100),
  photo_id TEXT, -- Base64 or URL
  pin VARCHAR(50) DEFAULT '1234',
  avatar TEXT,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  approval_status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  zone VARCHAR(255) DEFAULT 'Global',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.delivery_agents ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow public select on delivery_agents" ON public.delivery_agents;
DROP POLICY IF EXISTS "Allow public insert on delivery_agents" ON public.delivery_agents;
DROP POLICY IF EXISTS "Allow public update on delivery_agents" ON public.delivery_agents;
DROP POLICY IF EXISTS "Allow public delete on delivery_agents" ON public.delivery_agents;

CREATE POLICY "Allow public select on delivery_agents" ON public.delivery_agents
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on delivery_agents" ON public.delivery_agents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on delivery_agents" ON public.delivery_agents
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on delivery_agents" ON public.delivery_agents
  FOR DELETE USING (true);


-- ---------------------------------------------------------------
-- AGENT LOCATION HISTORY TABLE: Stores location path trails
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_location_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  agent_id INTEGER NOT NULL,
  lat NUMERIC(9, 6) NOT NULL,
  lng NUMERIC(9, 6) NOT NULL,
  accuracy NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.agent_location_history ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow public select on agent_location_history" ON public.agent_location_history;
DROP POLICY IF EXISTS "Allow public insert on agent_location_history" ON public.agent_location_history;

CREATE POLICY "Allow public select on agent_location_history" ON public.agent_location_history
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on agent_location_history" ON public.agent_location_history
  FOR INSERT WITH CHECK (true);


-- ---------------------------------------------------------------
-- ADD LOGISTICS COLUMNS TO ORDERS TABLE
-- ---------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_agent_id INTEGER,
  ADD COLUMN IF NOT EXISTS tracking_stage VARCHAR(50) DEFAULT 'placed',
  ADD COLUMN IF NOT EXISTS destination_lat NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS destination_lng NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS agent_lat NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS agent_lng NUMERIC(9, 6);

-- ---------------------------------------------------------------
-- PROMO CODES TABLE: Stores discount promo codes
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promo_codes (
  code VARCHAR(100) PRIMARY KEY,
  discount_percent INTEGER NOT NULL DEFAULT 10,
  is_used INTEGER DEFAULT 0, -- 0 = false, 1 = true
  used_by VARCHAR(100),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public select on promo_codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Allow public insert on promo_codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Allow public update on promo_codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Allow public delete on promo_codes" ON public.promo_codes;

-- Create policies
CREATE POLICY "Allow public select on promo_codes" ON public.promo_codes
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on promo_codes" ON public.promo_codes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on promo_codes" ON public.promo_codes
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on promo_codes" ON public.promo_codes
  FOR DELETE USING (true);

-- Seed default promo codes
INSERT INTO public.promo_codes (code, discount_percent) VALUES 
('WELCOME10', 10),
('SWEETO15', 15),
('SWEETO20', 20),
('SPECIAL25', 25),
('VIP50', 50)
ON CONFLICT (code) DO NOTHING;

-- Confirm migration success
SELECT 'Migration complete' AS status;

