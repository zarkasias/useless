-- Open alongside session B in a separate Supabase SQL Editor browser tab.
-- Run this entire file, then run session B while this query is waiting.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '40s';

do $$
declare
  test_user_id uuid;
begin
  select id into strict test_user_id
  from public.profiles
  where username = 'achievemaster' and role = 'user'
  for update;

  -- Hold the same account lock acquired by the award guard.
  perform pg_sleep(30);
end;
$$;

rollback;
