create table if not exists public.diary_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  last_synced_at timestamptz
);

alter table public.diary_snapshots enable row level security;

drop policy if exists "Users can read their own snapshot" on public.diary_snapshots;
create policy "Users can read their own snapshot"
on public.diary_snapshots
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own snapshot" on public.diary_snapshots;
create policy "Users can insert their own snapshot"
on public.diary_snapshots
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own snapshot" on public.diary_snapshots;
create policy "Users can update their own snapshot"
on public.diary_snapshots
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
