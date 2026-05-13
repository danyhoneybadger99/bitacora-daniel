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

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  email text,
  profile_type text,
  newsletter_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create unique index if not exists app_users_user_id_idx
on public.app_users (user_id);

alter table public.app_users enable row level security;

drop policy if exists "Users can read their own app user record" on public.app_users;
create policy "Users can read their own app user record"
on public.app_users
for select
to authenticated
using (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "Users can insert their own app user record" on public.app_users;
create policy "Users can insert their own app user record"
on public.app_users
for insert
to authenticated
with check (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "Users can update their own app user record" on public.app_users;
create policy "Users can update their own app user record"
on public.app_users
for update
to authenticated
using (auth.uid() is not null and user_id = auth.uid())
with check (auth.uid() is not null and user_id = auth.uid());

create table if not exists public.newsletter_send_log (
  id uuid primary key default gen_random_uuid(),
  issue_id text not null,
  recipient_email text not null,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists newsletter_send_log_sent_once_idx
on public.newsletter_send_log (issue_id, lower(recipient_email))
where status = 'sent';

create index if not exists newsletter_send_log_issue_idx
on public.newsletter_send_log (issue_id, created_at desc);

alter table public.newsletter_send_log enable row level security;
