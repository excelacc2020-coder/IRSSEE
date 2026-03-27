-- EA Command Center — Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── sessions ────────────────────────────────────────────────────────────────
create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day integer not null check (day >= 1 and day <= 50),
  topic text not null default '',
  part integer not null check (part in (1, 2, 3)),
  morning_brief_viewed boolean not null default false,
  study_notes text not null default '',
  mind_map_generated boolean not null default false,
  mind_map_content text not null default '',
  quiz_questions jsonb,
  quiz_answers jsonb,
  quiz_score integer,
  quiz_passed boolean not null default false,
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, day)
);

alter table sessions enable row level security;

create policy "Users can only access their own sessions"
  on sessions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── errors ──────────────────────────────────────────────────────────────────
create table if not exists errors (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day integer not null,
  topic text not null,
  part integer not null check (part in (1, 2, 3)),
  question text not null,
  user_answer text not null,
  correct_answer text not null,
  explanation text not null default '',
  category text not null check (category in ('rule_gap', 'calculation_error', 'exception_missed', 'trap_fallen')),
  created_at timestamptz not null default now()
);

alter table errors enable row level security;

create policy "Users can only access their own errors"
  on errors for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── anki_cards ──────────────────────────────────────────────────────────────
create table if not exists anki_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day integer not null,
  topic text not null,
  question text not null,
  answer text not null,
  status text not null default 'new' check (status in ('new', 'reviewing', 'mastered')),
  times_reviewed integer not null default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table anki_cards enable row level security;

create policy "Users can only access their own cards"
  on anki_cards for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── user_settings ────────────────────────────────────────────────────────────
create table if not exists user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  ai_provider text not null default 'claude',
  ai_api_key text not null default '',
  ai_model text not null default 'claude-opus-4-6',
  current_day integer not null default 1 check (current_day >= 1 and current_day <= 50),
  updated_at timestamptz not null default now()
);

alter table user_settings enable row level security;

create policy "Users can only access their own settings"
  on user_settings for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists sessions_user_day on sessions(user_id, day);
create index if not exists errors_user_id on errors(user_id);
create index if not exists errors_user_category on errors(user_id, category);
create index if not exists anki_cards_user_id on anki_cards(user_id);
create index if not exists anki_cards_user_status on anki_cards(user_id, status);

-- ─── updated_at trigger ───────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger sessions_updated_at
  before update on sessions
  for each row execute function update_updated_at();

create trigger user_settings_updated_at
  before update on user_settings
  for each row execute function update_updated_at();
