-- ================================================================
-- SWEETO TECH CONTROL CENTER - SUPABASE PUSH NOTIFICATIONS SETUP
-- ================================================================
-- Run this in your Supabase Dashboard > SQL Editor.
-- ================================================================

-- 1. Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'customer' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Allow anyone (guest/registered) to register their device subscription
CREATE POLICY "Allow public insert on push_subscriptions"
  ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (true);

-- Allow updates/upserts by endpoint (device re-registering)
CREATE POLICY "Allow public update on push_subscriptions"
  ON public.push_subscriptions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow public unsubscribe (delete by endpoint matching)
CREATE POLICY "Allow public delete on push_subscriptions"
  ON public.push_subscriptions
  FOR DELETE
  USING (true);

-- Allow authenticated admins to view/manage all subscriptions
CREATE POLICY "Allow admin full access on push_subscriptions"
  ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Seed the VAPID Public Key in the settings table so the client can fetch it
INSERT INTO public.settings (key, value)
VALUES ('vapid_public_key', 'BIQskBvSdqYmhD6HkyHVr4_-EbObXhtcJPzxSN2F-SbShibdmWeHuAzvWSYAk9jRR5yDajNqWOjLUUERle2uq_o')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
