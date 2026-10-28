-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Algerian DZD Receipts (BaridiMob)
-- Execute this script in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dzd_receipts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles (id) ON DELETE SET NULL,
  user_name text NOT NULL,
  user_email text NOT NULL,
  plan text NOT NULL CHECK (plan IN ('plus', 'pro')),
  billing_interval text NOT NULL CHECK (billing_interval IN ('monthly', 'annual')),
  amount_dzd integer NOT NULL,
  receipt_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE dzd_receipts ENABLE ROW LEVEL SECURITY;

-- Allow public or authenticated users to insert receipts
CREATE POLICY "dzd_receipts_insert" ON dzd_receipts 
  FOR INSERT WITH CHECK (true);

-- Allow users to view their own receipts
CREATE POLICY "dzd_receipts_select_user" ON dzd_receipts 
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow admins to view, update, delete all receipts
CREATE POLICY "dzd_receipts_admin_all" ON dzd_receipts 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_dzd_receipts_created_at ON dzd_receipts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dzd_receipts_status ON dzd_receipts (status);
CREATE INDEX IF NOT EXISTS idx_dzd_receipts_user_email ON dzd_receipts (user_email);
