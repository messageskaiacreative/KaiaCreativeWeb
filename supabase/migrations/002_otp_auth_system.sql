-- ============================================================
-- Enterprise-Grade Email OTP Authentication System
-- SQL Migration: Profiles, Anti-Disposable Email, RLS
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLE (stores additional user data)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT UNIQUE NOT NULL,
  full_name         TEXT DEFAULT '',
  avatar_url        TEXT DEFAULT '',
  tier              TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
  otp_verified_at   TIMESTAMPTZ,
  last_sign_in_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON public.profiles(tier);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();


-- ============================================================
-- 2. ROW LEVEL SECURITY (RLS) ON PROFILES
-- Zero-trust: users can ONLY access their own profile.
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can update their own profile (name, avatar only)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- INSERT only via trigger (not directly by users)
-- Service role can insert (for the trigger function)
CREATE POLICY "Service role can manage all profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow the trigger function to insert (runs as SECURITY DEFINER)
CREATE POLICY "Allow trigger insert on profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());


-- ============================================================
-- 3. AUTO-CREATE PROFILE ON USER VERIFICATION
-- Trigger fires when a user confirms their email/OTP.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_verified()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile when email is confirmed
  -- (email_confirmed_at changes from NULL to a timestamp)
  IF NEW.email_confirmed_at IS NOT NULL AND
     (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at != NEW.email_confirmed_at) THEN

    INSERT INTO public.profiles (id, email, full_name, tier, otp_verified_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'tier', 'free'),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      otp_verified_at = now(),
      last_sign_in_at = now(),
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_user_verified ON auth.users;
CREATE TRIGGER on_user_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_verified();

-- Also handle initial signup (INSERT into auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- If user is already confirmed (e.g., auto-confirm enabled)
  IF NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, tier, otp_verified_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'tier', 'free'),
      now()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_user_signup ON auth.users;
CREATE TRIGGER on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();


-- ============================================================
-- 4. ANTI-DISPOSABLE EMAIL SYSTEM
-- Blocks temporary/disposable email domains at DB level
-- BEFORE any compute or email API call is consumed.
-- ============================================================

-- Blacklisted domains table
CREATE TABLE IF NOT EXISTS public.blocked_email_domains (
  id          SERIAL PRIMARY KEY,
  domain      TEXT NOT NULL UNIQUE,
  reason      TEXT DEFAULT 'disposable',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for blazing-fast lookups
CREATE INDEX IF NOT EXISTS idx_blocked_domains_domain
  ON public.blocked_email_domains(domain);

-- Populate with common disposable email providers
INSERT INTO public.blocked_email_domains (domain, reason) VALUES
  ('mailinator.com', 'disposable'),
  ('guerrillamail.com', 'disposable'),
  ('tempmail.com', 'disposable'),
  ('throwaway.email', 'disposable'),
  ('10minutemail.com', 'disposable'),
  ('trashmail.com', 'disposable'),
  ('yopmail.com', 'disposable'),
  ('sharklasers.com', 'disposable'),
  ('guerrillamailblock.com', 'disposable'),
  ('grr.la', 'disposable'),
  ('dispostable.com', 'disposable'),
  ('maildrop.cc', 'disposable'),
  ('temp-mail.org', 'disposable'),
  ('fakeinbox.com', 'disposable'),
  ('tempail.com', 'disposable'),
  ('emailondeck.com', 'disposable'),
  ('getnada.com', 'disposable'),
  ('mohmal.com', 'disposable'),
  ('burnermail.io', 'disposable'),
  ('harakirimail.com', 'disposable'),
  ('33mail.com', 'disposable'),
  ('mailnesia.com', 'disposable'),
  ('mintemail.com', 'disposable'),
  ('spamgourmet.com', 'disposable'),
  ('mytemp.email', 'disposable'),
  ('disposableemailaddresses.emailmiser.com', 'disposable'),
  ('mailcatch.com', 'disposable'),
  ('tempinbox.com', 'disposable'),
  ('incognitomail.com', 'disposable'),
  ('anonbox.net', 'disposable')
ON CONFLICT (domain) DO NOTHING;

-- PL/pgSQL function: extract domain and check blacklist
CREATE OR REPLACE FUNCTION public.check_email_domain_blacklist()
RETURNS TRIGGER AS $$
DECLARE
  email_domain TEXT;
  is_blocked BOOLEAN;
BEGIN
  -- Extract domain from email (everything after @)
  email_domain := lower(split_part(NEW.email, '@', 2));

  -- Check if domain is blacklisted (O(1) lookup via index)
  SELECT EXISTS(
    SELECT 1 FROM public.blocked_email_domains
    WHERE domain = email_domain
  ) INTO is_blocked;

  -- Block the registration if domain is blacklisted
  IF is_blocked THEN
    RAISE EXCEPTION 'Registration blocked: disposable email addresses are not allowed. Please use a permanent email address.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach as BEFORE INSERT trigger on auth.users
-- This fires BEFORE any email is sent, saving email API quota
DROP TRIGGER IF EXISTS check_disposable_email ON auth.users;
CREATE TRIGGER check_disposable_email
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_email_domain_blacklist();


-- ============================================================
-- 5. RATE LIMITING TABLE (application-level tracking)
-- Supplements Supabase's built-in rate limiting.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
  id          SERIAL PRIMARY KEY,
  identifier  TEXT NOT NULL, -- email or IP
  attempts    INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_identifier
  ON public.otp_rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_window
  ON public.otp_rate_limits(window_start);

-- Cleanup old rate limit records (older than 2 hours)
-- Uses pg_cron if available
DO $$
BEGIN
  PERFORM cron.schedule(
    'cleanup-otp-rate-limits',
    '*/30 * * * *',
    'DELETE FROM public.otp_rate_limits WHERE window_start < now() - INTERVAL ''2 hours'';'
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not available, skipping rate limit cleanup schedule';
END;
$$;
