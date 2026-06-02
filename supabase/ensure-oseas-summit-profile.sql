-- Manual, idempotent setup for Oseas Tonche as the private beta Summit profile.
-- Run in Supabase SQL editor only after confirming the Auth user exists.
-- This does not change schema, RLS, Edge Functions, diary_snapshots, private data, or newsletter sends.
-- It only aligns public.app_users administrative metadata for the authenticated user.

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
  'oseas-summit',
  false,
  now()
from auth.users as users
where lower(users.email) = lower('oseas.tonche@outlook.com')
on conflict (user_id) do update
set
  email = excluded.email,
  profile_type = 'oseas-summit',
  newsletter_opt_in = public.app_users.newsletter_opt_in,
  last_seen_at = now();

-- Verification: should return Oseas with profile_type = oseas-summit after manual execution.
select
  email,
  profile_type,
  newsletter_opt_in,
  last_seen_at
from public.app_users
where lower(email) = lower('oseas.tonche@outlook.com');
