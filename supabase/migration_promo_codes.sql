-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: DZD Promo Codes & Collaborators System
-- Execute this script in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dzd_promo_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  collaborator_name text NOT NULL,
  collaborator_email text,
  commission_type text NOT NULL CHECK (commission_type IN ('percent', 'fixed')),
  commission_value numeric NOT NULL CHECK (commission_value >= 0),
  secret_token text UNIQUE NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  max_uses integer DEFAULT NULL,
  uses_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add promo tracking columns to dzd_receipts
ALTER TABLE dzd_receipts 
  ADD COLUMN IF NOT EXISTS promo_code_id uuid REFERENCES dzd_promo_codes (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS original_amount_dzd integer,
  ADD COLUMN IF NOT EXISTS discount_applied numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_amount numeric DEFAULT 0;

-- Enable RLS
ALTER TABLE dzd_promo_codes ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "dzd_promo_codes_admin_all" ON dzd_promo_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow public read of active promo codes for validation (optional if server-side, but good practice)
CREATE POLICY "dzd_promo_codes_public_read" ON dzd_promo_codes
  FOR SELECT USING (true);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_dzd_promo_codes_code ON dzd_promo_codes (code);
CREATE INDEX IF NOT EXISTS idx_dzd_promo_codes_secret_token ON dzd_promo_codes (secret_token);
CREATE INDEX IF NOT EXISTS idx_dzd_receipts_promo_code_id ON dzd_receipts (promo_code_id);
