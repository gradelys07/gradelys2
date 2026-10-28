-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Add education_system column to profiles
-- Run this in Supabase SQL Editor (SQL Editor → New query → Run)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS education_system text NOT NULL DEFAULT 'Standard';

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
