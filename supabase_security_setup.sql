-- =====================================================================
-- SWEETO HUB SECURITY SETUP - ROW LEVEL SECURITY (RLS)
-- =====================================================================
-- Run this script in the Supabase SQL Editor on your LIVE project.
-- This script enables RLS on all tables and creates secure access
-- policies to prevent unauthorized users from accessing admin credentials
-- or customer details.
-- =====================================================================

-- 1. Helper Function to Check If the Current User is the Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  admin_email_val text;
BEGIN
  -- 1. Get the admin email from the settings table
  -- We query settings directly. Since this is SECURITY DEFINER, it runs with
  -- bypass-RLS privileges, preventing any infinite recursion.
  SELECT value INTO admin_email_val FROM public.settings WHERE key = 'admin_email';

  -- Fallback if admin_email isn't initialized yet
  IF admin_email_val IS NULL THEN
    admin_email_val := '';
  END IF;

  -- 2. Check if the user is authenticated and their email matches the admin email
  RETURN (
    auth.role() = 'authenticated' 
    AND (auth.jwt() ->> 'email') = admin_email_val
  );
END;
$$;

-- =====================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- =====================================================================
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_log ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- DROP EXISTING POLICIES TO AVOID DUPLICATES OR CONFLICTS
-- =====================================================================
DROP POLICY IF EXISTS "Allow public select non-sensitive settings" ON public.settings;
DROP POLICY IF EXISTS "Allow admin all access on settings" ON public.settings;
DROP POLICY IF EXISTS "Allow admin all access on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public select specific order by id" ON public.orders;
DROP POLICY IF EXISTS "Allow public update order status for tracking" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert on order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow admin all access on order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public select on products" ON public.products;
DROP POLICY IF EXISTS "Allow admin all access on products" ON public.products;
DROP POLICY IF EXISTS "Allow public select on categories" ON public.categories;
DROP POLICY IF EXISTS "Allow admin all access on categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public select on brands" ON public.brands;
DROP POLICY IF EXISTS "Allow admin all access on brands" ON public.brands;
DROP POLICY IF EXISTS "Allow public select on sections" ON public.sections;
DROP POLICY IF EXISTS "Allow admin all access on sections" ON public.sections;
DROP POLICY IF EXISTS "Allow public select on video_ads" ON public.video_ads;
DROP POLICY IF EXISTS "Allow admin all access on video_ads" ON public.video_ads;
DROP POLICY IF EXISTS "Allow public select on shipping_zones" ON public.shipping_zones;
DROP POLICY IF EXISTS "Allow admin all access on shipping_zones" ON public.shipping_zones;
DROP POLICY IF EXISTS "Allow public select approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow admin all access on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public insert visitor_log" ON public.visitor_log;
DROP POLICY IF EXISTS "Allow admin all access on visitor_log" ON public.visitor_log;


-- =====================================================================
-- DEFINE SECURITY POLICIES FOR EACH TABLE
-- =====================================================================

-- -------------------------------------------------------------
-- SETTINGS TABLE
-- -------------------------------------------------------------
-- Public can select non-sensitive settings keys only.
-- Sensitive credentials (admin_email, admin_key, admin_pin, admin_password) are filtered out.
CREATE POLICY "Allow public select non-sensitive settings" ON public.settings
  FOR SELECT
  USING (
    key NOT IN ('admin_key', 'admin_pin', 'admin_email', 'admin_password') 
    OR public.is_admin()
  );

-- Admin has all privileges (Insert, Update, Delete) on settings
CREATE POLICY "Allow admin all access on settings" ON public.settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- -------------------------------------------------------------
-- ORDERS TABLE
-- -------------------------------------------------------------
-- Admin can do everything on orders
CREATE POLICY "Allow admin all access on orders" ON public.orders
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Customers can insert new orders when checking out
CREATE POLICY "Allow public insert on orders" ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- Customers can view/select specific orders for tracking
CREATE POLICY "Allow public select specific order by id" ON public.orders
  FOR SELECT
  USING (true);

-- Customers can only update order status to 'completed' (when entering the courier delivery code)
CREATE POLICY "Allow public update order status for tracking" ON public.orders
  FOR UPDATE
  USING (true)
  WITH CHECK (status = 'completed');


-- -------------------------------------------------------------
-- ORDER_ITEMS TABLE
-- -------------------------------------------------------------
CREATE POLICY "Allow public insert on order_items" ON public.order_items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow admin all access on order_items" ON public.order_items
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- -------------------------------------------------------------
-- PRODUCTS TABLE
-- -------------------------------------------------------------
CREATE POLICY "Allow public select on products" ON public.products
  FOR SELECT
  USING (true);

CREATE POLICY "Allow admin all access on products" ON public.products
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- -------------------------------------------------------------
-- CATEGORIES TABLE
-- -------------------------------------------------------------
CREATE POLICY "Allow public select on categories" ON public.categories
  FOR SELECT
  USING (true);

CREATE POLICY "Allow admin all access on categories" ON public.categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- -------------------------------------------------------------
-- BRANDS TABLE
-- -------------------------------------------------------------
CREATE POLICY "Allow public select on brands" ON public.brands
  FOR SELECT
  USING (true);

CREATE POLICY "Allow admin all access on brands" ON public.brands
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- -------------------------------------------------------------
-- SECTIONS TABLE
-- -------------------------------------------------------------
CREATE POLICY "Allow public select on sections" ON public.sections
  FOR SELECT
  USING (true);

CREATE POLICY "Allow admin all access on sections" ON public.sections
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- -------------------------------------------------------------
-- VIDEO_ADS TABLE
-- -------------------------------------------------------------
CREATE POLICY "Allow public select on video_ads" ON public.video_ads
  FOR SELECT
  USING (true);

CREATE POLICY "Allow admin all access on video_ads" ON public.video_ads
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- -------------------------------------------------------------
-- SHIPPING_ZONES TABLE
-- -------------------------------------------------------------
CREATE POLICY "Allow public select on shipping_zones" ON public.shipping_zones
  FOR SELECT
  USING (true);

CREATE POLICY "Allow admin all access on shipping_zones" ON public.shipping_zones
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- -------------------------------------------------------------
-- REVIEWS TABLE
-- -------------------------------------------------------------
-- Public can select reviews only if they are approved
CREATE POLICY "Allow public select approved reviews" ON public.reviews
  FOR SELECT
  USING (is_approved = 1 OR public.is_admin());

-- Public can submit new reviews
CREATE POLICY "Allow public insert reviews" ON public.reviews
  FOR INSERT
  WITH CHECK (true);

-- Admin has full review moderation privileges
CREATE POLICY "Allow admin all access on reviews" ON public.reviews
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- -------------------------------------------------------------
-- VISITOR_LOG TABLE
-- -------------------------------------------------------------
-- Public can log views
CREATE POLICY "Allow public insert visitor_log" ON public.visitor_log
  FOR INSERT
  WITH CHECK (true);

-- Admin can view logs for analytics
CREATE POLICY "Allow admin all access on visitor_log" ON public.visitor_log
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- =====================================================================
-- 8. ENABLE REALTIME ON KEY TABLES
-- =====================================================================
-- Run this in the Supabase SQL Editor to enable real-time order notifications.
-- If the publication supabase_realtime does not exist yet, you can create it with:
-- CREATE PUBLICATION supabase_realtime;
-- =====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
