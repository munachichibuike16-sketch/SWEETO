-- ================================================================
-- SWEETO SUPABASE ANALYTICS MIGRATION — Search & Traffic Tracking
-- ================================================================
-- Run this in Supabase > SQL Editor on your LIVE project.
-- ================================================================

-- 1. Successful Searches Table
CREATE TABLE IF NOT EXISTS public.successful_searches (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(255) UNIQUE NOT NULL,
  search_count INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.successful_searches ENABLE ROW LEVEL SECURITY;

-- Policies for successful_searches
DROP POLICY IF EXISTS "Allow public select on successful_searches" ON public.successful_searches;
DROP POLICY IF EXISTS "Allow public insert on successful_searches" ON public.successful_searches;
DROP POLICY IF EXISTS "Allow public update on successful_searches" ON public.successful_searches;

CREATE POLICY "Allow public select on successful_searches" ON public.successful_searches
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on successful_searches" ON public.successful_searches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on successful_searches" ON public.successful_searches
  FOR UPDATE USING (true) WITH CHECK (true);

-- 2. Failed Searches Table
CREATE TABLE IF NOT EXISTS public.failed_searches (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(255) UNIQUE NOT NULL,
  search_count INTEGER DEFAULT 1,
  bounce_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.failed_searches ENABLE ROW LEVEL SECURITY;

-- Policies for failed_searches
DROP POLICY IF EXISTS "Allow public select on failed_searches" ON public.failed_searches;
DROP POLICY IF EXISTS "Allow public insert on failed_searches" ON public.failed_searches;
DROP POLICY IF EXISTS "Allow public update on failed_searches" ON public.failed_searches;

CREATE POLICY "Allow public select on failed_searches" ON public.failed_searches
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on failed_searches" ON public.failed_searches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on failed_searches" ON public.failed_searches
  FOR UPDATE USING (true) WITH CHECK (true);


-- 3. Stored Procedures (RPCs) for Atomic Increments
-- Run these to allow client-side increments without exposing full update permissions

-- RPC to increment successful search popularity
CREATE OR REPLACE FUNCTION public.increment_search_popularity(search_term TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.successful_searches (keyword, search_count)
  VALUES (LOWER(TRIM(search_term)), 1)
  ON CONFLICT (keyword)
  DO UPDATE SET search_count = public.successful_searches.search_count + 1, updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to increment failed search count
CREATE OR REPLACE FUNCTION public.increment_failed_search(search_term TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.failed_searches (keyword, search_count, bounce_count)
  VALUES (LOWER(TRIM(search_term)), 1, 0)
  ON CONFLICT (keyword)
  DO UPDATE SET search_count = public.failed_searches.search_count + 1, updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to increment failed search bounce count
CREATE OR REPLACE FUNCTION public.increment_failed_search_bounce(search_term TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.failed_searches
  SET bounce_count = bounce_count + 1, updated_at = CURRENT_TIMESTAMP
  WHERE keyword = LOWER(TRIM(search_term));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Confirm migration
SELECT 'Analytics migration complete' AS status;
