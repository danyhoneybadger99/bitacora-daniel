-- Reparable setup for Jesus Flores as an active Bitacora Daniel newsletter opt-in.
-- Run in Supabase SQL editor after confirming the Auth user exists.
-- This does not change RLS, schema, diary_snapshots, or private data.

insert into public.app_users (
  user_id,
  email,
  profile_type,
  newsletter_opt_in,
  last_seen_at
)
select
  users.id,
  users.email,
  'krav-360',
  true,
  now()
from auth.users as users
where lower(users.email) = lower('jfloresm1994@gmail.com')
on conflict (user_id) do update
set
  email = excluded.email,
  profile_type = 'krav-360',
  newsletter_opt_in = true,
  last_seen_at = now();

-- Verification: should return Daniel and Jesus when both are active opt-ins.
select
  email,
  profile_type,
  newsletter_opt_in,
  last_seen_at
from public.app_users
where newsletter_opt_in = true
order by email;
