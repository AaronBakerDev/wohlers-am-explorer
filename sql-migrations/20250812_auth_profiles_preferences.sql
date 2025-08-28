-- Auth, profiles, preferences, saved searches, and RBAC setup
-- Run this in your Supabase SQL editor or via migration tooling

-- Profiles table: 1-1 with auth.users
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text generated always as ((auth.jwt() ->> 'email')) stored null,
  full_name text,
  avatar_url text,
  role text not null default 'basic', -- basic | premium | admin
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

-- Allow users to read and update their own profile
create policy if not exists "Profiles are viewable by owner" on public.profiles
  for select using (auth.uid() = user_id);

create policy if not exists "Profiles are insertable by owner" on public.profiles
  for insert with check (auth.uid() = user_id);

create policy if not exists "Profiles are updatable by owner" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Preferences table
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text default 'system', -- system | light | dark
  default_filters jsonb default '{}'::jsonb,
  export_preferences jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.user_preferences enable row level security;

create policy if not exists "Preferences readable by owner" on public.user_preferences
  for select using (auth.uid() = user_id);

create policy if not exists "Preferences upsert by owner" on public.user_preferences
  for insert with check (auth.uid() = user_id);

create policy if not exists "Preferences update by owner" on public.user_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Saved searches table
create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  query jsonb not null,
  created_at timestamp with time zone default now()
);

alter table public.saved_searches enable row level security;

create index if not exists saved_searches_user_id_idx on public.saved_searches(user_id);

create policy if not exists "Saved searches readable by owner" on public.saved_searches
  for select using (auth.uid() = user_id);

create policy if not exists "Saved searches insert by owner" on public.saved_searches
  for insert with check (auth.uid() = user_id);

create policy if not exists "Saved searches delete by owner" on public.saved_searches
  for delete using (auth.uid() = user_id);

-- Helper trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists prefs_set_updated_at on public.user_preferences;
create trigger prefs_set_updated_at
before update on public.user_preferences
for each row execute procedure public.set_updated_at();

-- Optional: create storage bucket for avatars (requires service role)
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
--   on conflict (id) do nothing;

