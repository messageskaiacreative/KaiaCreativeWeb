-- ============================================================
-- PDF-to-Text Extraction System — Supabase Setup
-- Phase 1: Database, Storage, Security & Auto-Cleanup
-- ============================================================

-- ============================================================
-- 1. CREATE STORAGE BUCKET: documents
-- ============================================================
-- Run this in the Supabase Dashboard > Storage > New Bucket
-- Name: documents
-- Public: false (private)
-- Max file size: 20MB
-- Allowed MIME types: application/pdf

-- Storage RLS Policies (run in SQL Editor):
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  20971520, -- 20MB
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Users can upload to their own folder
CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own files
CREATE POLICY "Users can read their own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files
CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service role can access all (for Python worker)
CREATE POLICY "Service role can access all documents"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');


-- ============================================================
-- 2. CREATE EXTRACTION STATUS ENUM & TABLE
-- ============================================================
CREATE TYPE extraction_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

CREATE TABLE IF NOT EXISTS public.extractions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path   TEXT NOT NULL,
  status      extraction_status NOT NULL DEFAULT 'pending',
  extracted_markdown TEXT,
  error_message TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_extractions_user_id ON public.extractions(user_id);
CREATE INDEX idx_extractions_status ON public.extractions(status);
CREATE INDEX idx_extractions_created_at ON public.extractions(created_at);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.extractions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.extractions ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 3. RLS POLICIES ON extractions
-- ============================================================

-- Users can view their own extractions
CREATE POLICY "Users can view own extractions"
  ON public.extractions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own extractions
CREATE POLICY "Users can insert own extractions"
  ON public.extractions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own extractions
CREATE POLICY "Users can delete own extractions"
  ON public.extractions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Service role bypass (for Python worker)
CREATE POLICY "Service role full access on extractions"
  ON public.extractions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- 4. REALTIME — Enable for extractions table
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.extractions;


-- ============================================================
-- 5. WEBHOOK TRIGGER — Notify Python Worker on new extraction
-- ============================================================
-- NOTE: Replace YOUR_WORKER_URL and YOUR_WEBHOOK_SECRET below
-- with your actual deployed Python worker URL and secret key.

CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION notify_extraction_worker()
RETURNS TRIGGER AS $$
DECLARE
  worker_url TEXT := 'YOUR_WORKER_URL/process-webhook';
  webhook_secret TEXT := 'YOUR_WEBHOOK_SECRET';
  payload JSONB;
  response extensions.http_response;
BEGIN
  -- Only fire for new pending rows
  IF NEW.status = 'pending' THEN
    payload := jsonb_build_object(
      'id', NEW.id,
      'user_id', NEW.user_id,
      'file_path', NEW.file_path
    );

    -- Fire HTTP POST to Python worker
    SELECT * INTO response FROM extensions.http((
      'POST',
      worker_url,
      ARRAY[
        extensions.http_header('Authorization', 'Bearer ' || webhook_secret),
        extensions.http_header('Content-Type', 'application/json')
      ],
      'application/json',
      payload::text
    )::extensions.http_request);

    -- Log if request failed (non-blocking)
    IF response.status != 200 THEN
      RAISE WARNING 'Webhook failed with status %: %', response.status, response.content;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't block the INSERT if webhook fails
    RAISE WARNING 'Webhook error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_extraction_created
  AFTER INSERT ON public.extractions
  FOR EACH ROW
  EXECUTE FUNCTION notify_extraction_worker();


-- ============================================================
-- 6. EPHEMERAL AUTO-CLEANUP (pg_cron)
-- ============================================================
-- Enable pg_cron extension (must be done by superuser/dashboard)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Schedule: Every hour, delete extractions older than 24 hours
-- Also clean up storage files via a helper function
SELECT cron.schedule(
  'cleanup-expired-extractions',
  '0 * * * *', -- Every hour at minute 0
  $$
    -- Delete the storage objects first (via Supabase storage API internally)
    -- Then delete the database rows
    DELETE FROM public.extractions
    WHERE created_at < now() - INTERVAL '24 hours';
  $$
);

-- Optional: Clean up storage files when extraction rows are deleted
CREATE OR REPLACE FUNCTION cleanup_extraction_storage()
RETURNS TRIGGER AS $$
BEGIN
  -- Attempt to delete the file from storage
  DELETE FROM storage.objects
  WHERE bucket_id = 'documents'
    AND name = OLD.file_path;
  RETURN OLD;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Storage cleanup error: %', SQLERRM;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_extraction_deleted
  BEFORE DELETE ON public.extractions
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_extraction_storage();
