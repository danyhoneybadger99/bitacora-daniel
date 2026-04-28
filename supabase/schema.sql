create table if not exists public.diary_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  last_synced_at timestamptz
);

create unique index if not exists diary_snapshots_user_id_idx
on public.diary_snapshots (user_id);

alter table public.diary_snapshots enable row level security;

drop policy if exists "Users can read their own snapshot" on public.diary_snapshots;
create policy "Users can read their own snapshot"
on public.diary_snapshots
for select
to authenticated
using (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "Users can insert their own snapshot" on public.diary_snapshots;
create policy "Users can insert their own snapshot"
on public.diary_snapshots
for insert
to authenticated
with check (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "Users can update their own snapshot" on public.diary_snapshots;
create policy "Users can update their own snapshot"
on public.diary_snapshots
for update
to authenticated
using (auth.uid() is not null and user_id = auth.uid())
with check (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "Users can delete their own snapshot" on public.diary_snapshots;
create policy "Users can delete their own snapshot"
on public.diary_snapshots
for delete
to authenticated
using (auth.uid() is not null and user_id = auth.uid());
