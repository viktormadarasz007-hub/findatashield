-- Run this in the Supabase SQL editor for your project.

create table if not exists public.usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  month integer not null check (month between 1 and 12),
  year integer not null check (year >= 2020),
  examples_used integer not null default 0 check (examples_used >= 0),
  tier text not null default 'free' check (
    tier in ('free', 'growth', 'enterprise', 'custom')
  ),
  primary key (user_id, month, year)
);

create index if not exists usage_user_period_idx
  on public.usage (user_id, year desc, month desc);

alter table public.usage enable row level security;

create policy "Users can read own usage"
  on public.usage
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage"
  on public.usage
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own usage"
  on public.usage
  for update
  using (auth.uid() = user_id);

create table if not exists public.datasets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data_type text not null,
  example_count integer not null check (example_count >= 0),
  generated_at timestamptz not null default now(),
  data jsonb not null,
  compliance_report jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists datasets_user_generated_idx
  on public.datasets (user_id, generated_at desc);

alter table public.datasets enable row level security;

create policy "Users can read own datasets"
  on public.datasets
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own datasets"
  on public.datasets
  for insert
  with check (auth.uid() = user_id);
