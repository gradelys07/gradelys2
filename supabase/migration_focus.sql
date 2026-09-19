-- Run this in your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS feedbacks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles (id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  message text not null,
  team_message text,
  created_at timestamptz not null default now()
);

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedbacks_insert" ON feedbacks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feedbacks_select_admin" ON feedbacks FOR SELECT USING (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks (created_at desc);
