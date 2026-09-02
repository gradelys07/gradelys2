-- ═══════════════════════════════════════════════════════════════
-- GRADELYS v2.0 — SUPABASE SCHEMA
-- Run this entire file once against a fresh Supabase project
-- (SQL Editor → New query → paste → Run). Safe to re-run: uses
-- IF NOT EXISTS / CREATE OR REPLACE everywhere.
-- ═══════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ── PROFILES ─────────────────────────────────────────────────────
-- One row per auth.users row, created automatically by trigger below.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default 'Student',
  level text default 'High School',
  avatar_url text,
  lang text not null default 'en',
  education_system text not null default 'Standard',
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'pending', 'banned', 'deleted')),
  ban_reason text,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));

  insert into public.subscriptions (user_id, plan, credits_remaining, credits_max)
  values (new.id, 'free', 1, 1);

  insert into public.streaks (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── SUBSCRIPTIONS ────────────────────────────────────────────────
create table if not exists subscriptions (
  user_id uuid primary key references profiles (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'plus', 'pro')),
  billing_interval text not null default 'monthly' check (billing_interval in ('monthly', 'annual')),
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired')),
  credits_remaining integer not null default 3,
  credits_max integer not null default 3,
  reset_date timestamptz not null default (now() + interval '1 month'),
  current_period_end timestamptz,
  whop_subscription_id text,
  whop_customer_id text,
  updated_at timestamptz not null default now()
);

alter table subscriptions add column if not exists billing_interval text not null default 'monthly';

create table if not exists credit_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles (id) on delete cascade,
  delta integer not null,
  reason text not null,
  balance_after integer not null,
  created_at timestamptz not null default now()
);

-- ── SPACES ───────────────────────────────────────────────────────
create table if not exists spaces (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  emoji text not null default '📘',
  color text not null default '#4f46e5',
  template text not null default 'blank',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists space_sources (
  id uuid primary key default uuid_generate_v4(),
  space_id uuid not null references spaces (id) on delete cascade,
  type text not null check (type in ('pdf', 'url', 'youtube', 'text', 'spreadsheet', 'image')),
  name text not null,
  url text,
  storage_path text,
  content_preview text,
  status text not null default 'processing' check (status in ('processing', 'ready', 'error')),
  created_at timestamptz not null default now()
);

-- ── CHAT ─────────────────────────────────────────────────────────
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles (id) on delete cascade,
  space_id uuid references spaces (id) on delete set null,
  kind text not null default 'chat' check (kind in ('chat', 'visualize', 'studio', 'practice')),
  title text not null default 'New conversation',
  model text not null default 'auto' check (model in ('auto', 'flash', 'pro')),
  web_search_enabled boolean not null default false,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table conversations add column if not exists kind text not null default 'chat';

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb default '[]',
  attachments jsonb default '[]',
  structured jsonb,
  feedback text check (feedback in ('up', 'down')),
  created_at timestamptz not null default now()
);

alter table messages add column if not exists structured jsonb;

-- ── EXAMS ──────────────────────────────────────────────────────
create table if not exists exams (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles (id) on delete cascade,
  space_id uuid references spaces (id) on delete set null,
  subject text not null,
  format text not null,
  difficulty text not null,
  duration text not null,
  total_points integer not null,
  content_json jsonb not null,
  created_at timestamptz not null default now()
);

-- ── NOTES ────────────────────────────────────────────────────────
create table if not exists notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles (id) on delete cascade,
  space_id uuid references spaces (id) on delete set null,
  title text not null default 'Untitled note',
  content text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── FLASHCARDS (SM-2) ────────────────────────────────────────────
create table if not exists flashcard_decks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles (id) on delete cascade,
  space_id uuid references spaces (id) on delete set null,
  name text not null,
  subject text not null default 'General',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists flashcards (
  id uuid primary key default uuid_generate_v4(),
  deck_id uuid not null references flashcard_decks (id) on delete cascade,
  question text not null,
  answer text not null,
  hint text,
  tags text[] not null default '{}',
  easiness_factor real not null default 2.5,
  interval_days integer not null default 1,
  repetitions integer not null default 0,
  next_review_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── PRACTICE (QUIZ / EXAM) ───────────────────────────────────────
create table if not exists practice_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles (id) on delete cascade,
  space_id uuid references spaces (id) on delete set null,
  mode text not null check (mode in ('quiz', 'exam', 'flashcards')),
  subject text not null,
  score real not null default 0,
  total_questions integer not null default 0,
  correct_answers integer not null default 0,
  time_taken_seconds integer not null default 0,
  completed_at timestamptz not null default now()
);

alter table practice_sessions add column if not exists space_id uuid references spaces (id) on delete set null;

-- ── VISUALIZE ────────────────────────────────────────────────────
create table if not exists visualize_outputs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles (id) on delete cascade,
  space_id uuid references spaces (id) on delete set null,
  type text not null,
  prompt text not null,
  title text not null,
  description text,
  output_data jsonb not null,
  created_at timestamptz not null default now()
);

-- ── STUDIO ───────────────────────────────────────────────────────
create table if not exists studio_documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles (id) on delete cascade,
  space_id uuid references spaces (id) on delete set null,
  type text not null check (type in ('notes', 'report', 'summary', 'essay', 'slides')),
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── SCAN ─────────────────────────────────────────────────────────
create table if not exists scans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles (id) on delete cascade,
  subject text not null,
  chapter text,
  image_path text,
  status text not null default 'processing' check (status in ('processing', 'ready', 'error')),
  diagnostic jsonb,
  created_at timestamptz not null default now()
);

-- ── GAMIFICATION ─────────────────────────────────────────────────
create table if not exists streaks (
  user_id uuid primary key references profiles (id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date,
  total_study_days integer not null default 0
);

create table if not exists badges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles (id) on delete cascade,
  type text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, type)
);

-- ── ADMIN / SECURITY ─────────────────────────────────────────────
create table if not exists audit_log (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references profiles (id) on delete set null,
  admin_name text not null,
  action text not null,
  target_user text,
  details text,
  ip text,
  created_at timestamptz not null default now()
);

create table if not exists security_events (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  ip text,
  user_id uuid references profiles (id) on delete set null,
  details text,
  created_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table credit_transactions enable row level security;
alter table spaces enable row level security;
alter table space_sources enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table notes enable row level security;
alter table flashcard_decks enable row level security;
alter table flashcards enable row level security;
alter table practice_sessions enable row level security;
alter table visualize_outputs enable row level security;
alter table studio_documents enable row level security;
alter table scans enable row level security;
alter table streaks enable row level security;
alter table badges enable row level security;
alter table audit_log enable row level security;
alter table security_events enable row level security;
alter table exams enable row level security;

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Profiles: users read/update themselves; admins read/update all.
drop policy if exists "profiles_select" on profiles;
create policy "profiles_select" on profiles for select using (auth.uid() = id or is_admin());
drop policy if exists "profiles_update" on profiles;
create policy "profiles_update" on profiles for update using (auth.uid() = id or is_admin());

-- Subscriptions
drop policy if exists "subscriptions_select" on subscriptions;
create policy "subscriptions_select" on subscriptions for select using (auth.uid() = user_id or is_admin());
drop policy if exists "subscriptions_update" on subscriptions;
create policy "subscriptions_update" on subscriptions for update using (auth.uid() = user_id or is_admin());

drop policy if exists "credits_select" on credit_transactions;
create policy "credits_select" on credit_transactions for select using (auth.uid() = user_id or is_admin());
drop policy if exists "credits_insert" on credit_transactions;
create policy "credits_insert" on credit_transactions for insert with check (auth.uid() = user_id or is_admin());

-- Generic owner-only policy pattern applied to each user-owned table
drop policy if exists "spaces_all" on spaces;
create policy "spaces_all" on spaces for all using (auth.uid() = user_id or is_admin()) with check (auth.uid() = user_id);

drop policy if exists "sources_all" on space_sources;
create policy "sources_all" on space_sources for all using (
  exists (select 1 from spaces where spaces.id = space_sources.space_id and (spaces.user_id = auth.uid() or is_admin()))
);

drop policy if exists "conversations_all" on conversations;
create policy "conversations_all" on conversations for all using (auth.uid() = user_id or is_admin()) with check (auth.uid() = user_id);

drop policy if exists "messages_all" on messages;
create policy "messages_all" on messages for all using (
  exists (select 1 from conversations where conversations.id = messages.conversation_id and (conversations.user_id = auth.uid() or is_admin()))
);

drop policy if exists "notes_all" on notes;
create policy "notes_all" on notes for all using (auth.uid() = user_id or is_admin()) with check (auth.uid() = user_id);

drop policy if exists "decks_all" on flashcard_decks;
create policy "decks_all" on flashcard_decks for all using (auth.uid() = user_id or is_admin()) with check (auth.uid() = user_id);

drop policy if exists "cards_all" on flashcards;
create policy "cards_all" on flashcards for all using (
  exists (select 1 from flashcard_decks where flashcard_decks.id = flashcards.deck_id and (flashcard_decks.user_id = auth.uid() or is_admin()))
);

drop policy if exists "practice_all" on practice_sessions;
create policy "practice_all" on practice_sessions for all using (auth.uid() = user_id or is_admin()) with check (auth.uid() = user_id);

drop policy if exists "visualize_all" on visualize_outputs;
create policy "visualize_all" on visualize_outputs for all using (auth.uid() = user_id or is_admin()) with check (auth.uid() = user_id);

drop policy if exists "studio_all" on studio_documents;
create policy "studio_all" on studio_documents for all using (auth.uid() = user_id or is_admin()) with check (auth.uid() = user_id);

drop policy if exists "scans_all" on scans;
create policy "scans_all" on scans for all using (auth.uid() = user_id or is_admin()) with check (auth.uid() = user_id);

drop policy if exists "streaks_all" on streaks;
create policy "streaks_all" on streaks for all using (auth.uid() = user_id or is_admin()) with check (auth.uid() = user_id);

drop policy if exists "badges_all" on badges;
create policy "badges_all" on badges for all using (auth.uid() = user_id or is_admin()) with check (auth.uid() = user_id);

drop policy if exists "exams_all" on exams;
create policy "exams_all" on exams for all using (auth.uid() = user_id or is_admin()) with check (auth.uid() = user_id);

-- Admin-only tables
drop policy if exists "audit_log_admin" on audit_log;
create policy "audit_log_admin" on audit_log for all using (is_admin());

drop policy if exists "security_events_admin" on security_events;
create policy "security_events_admin" on security_events for all using (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════

create index if not exists idx_conversations_user on conversations (user_id, updated_at desc);
create index if not exists idx_conversations_kind on conversations (user_id, kind, space_id, updated_at desc);
create index if not exists idx_messages_conversation on messages (conversation_id, created_at);
create index if not exists idx_notes_user on notes (user_id, updated_at desc);
create index if not exists idx_flashcards_deck_due on flashcards (deck_id, next_review_at);
create index if not exists idx_scans_user on scans (user_id, created_at desc);
create index if not exists idx_spaces_user on spaces (user_id);
create index if not exists idx_sources_space on space_sources (space_id);
create index if not exists idx_studio_user on studio_documents (user_id, updated_at desc);
create index if not exists idx_visualize_user on visualize_outputs (user_id, created_at desc);
create index if not exists idx_practice_user on practice_sessions (user_id, completed_at desc);

-- ═══════════════════════════════════════════════════════════════
-- STORAGE BUCKETS (run once — safe if already created)
-- ═══════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('scans', 'scans', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('sources', 'sources', false)
on conflict (id) do nothing;

-- Storage RLS: each user may only read/write objects inside a folder
-- prefixed with their own user id, e.g. sources/{user_id}/{space_id}/{file}.
drop policy if exists "sources_storage_rw" on storage.objects;
create policy "sources_storage_rw" on storage.objects for all using (
  bucket_id = 'sources' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'sources' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "scans_storage_rw" on storage.objects;
create policy "scans_storage_rw" on storage.objects for all using (
  bucket_id = 'scans' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'scans' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_storage_read" on storage.objects;
create policy "avatars_storage_read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars_storage_write" on storage.objects;
create policy "avatars_storage_write" on storage.objects for insert with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
