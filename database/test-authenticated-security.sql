-- Run this entire file in Supabase SQL Editor as its default postgres role.
-- Temporarily simulate achievemaster's authenticated database session.
-- All settings and the no-op profile edit are rolled back.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '15s';

do $$
declare
  test_user_id uuid;
begin
  select id into strict test_user_id
  from public.profiles
  where username = 'achievemaster' and role = 'user';

  perform set_config('request.jwt.claim.sub', test_user_id::text, true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', test_user_id, 'role', 'authenticated')::text, true);
end;
$$;

set local role authenticated;

do $$
declare
  affected integer;
  blocked boolean;
begin
  if current_user <> 'authenticated' or auth.uid() is null then
    raise exception 'FAIL: authenticated test identity was not established';
  end if;

  -- Allowed own-profile edit, without changing the username.
  update public.profiles set username = username where id = auth.uid();
  get diagnostics affected = ROW_COUNT;
  if affected <> 1 then
    raise exception 'FAIL: own-profile username editing did not affect one row';
  end if;

  blocked := false;
  begin
    update public.profiles set role = 'admin' where id = auth.uid();
  exception when insufficient_privilege then
    blocked := true;
  end;
  if not blocked then
    raise exception 'FAIL: updating the admin role was not rejected';
  end if;

  blocked := false;
  begin
    insert into public.user_achievements (user_id, achievement_id)
    values (auth.uid(), gen_random_uuid());
  exception when insufficient_privilege then
    blocked := true;
  end;
  if not blocked then
    raise exception 'FAIL: direct achievement INSERT permission was not rejected';
  end if;

  blocked := false;
  begin
    perform image_prompt from public.achievements limit 1;
  exception when insufficient_privilege then
    blocked := true;
  end;
  if not blocked then
    raise exception 'FAIL: internal image prompts are readable';
  end if;

  blocked := false;
  begin
    perform trigger_config from public.achievements limit 1;
  exception when insufficient_privilege then
    blocked := true;
  end;
  if not blocked then
    raise exception 'FAIL: internal trigger configuration is readable';
  end if;

  if exists (select 1 from public.achievements where status <> 'published') then
    raise exception 'FAIL: an unpublished achievement is visible';
  end if;
end;
$$;

select 'PASS: own-profile editing works; admin changes, direct awards, and internal-field reads are denied; no unpublished awards visible' as result;

rollback;
