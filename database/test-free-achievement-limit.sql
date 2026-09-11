-- Run this ENTIRE file together in Supabase SQL Editor.
-- All test awards and definitions are rolled back, including on failure.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
declare
  test_user_id uuid;
  test_achievement_id uuid;
  starting_count integer;
  award_number integer;
  rejected_constraint text;
  eleventh_rejected boolean := false;
begin
  -- STRICT rejects missing or ambiguous usernames.
  select id into strict test_user_id
  from public.profiles
  where username = 'achievemaster' and role = 'user'
  for update;

  if exists (
    select 1 from public.subscriptions
    where user_id = test_user_id
      and status in ('active', 'trialing', 'past_due')
  ) then
    raise exception 'Test account must not have an eligible subscription';
  end if;

  select count(*) into starting_count
  from public.user_achievements where user_id = test_user_id;

  if starting_count >= 10 then
    raise exception 'Test account already has ten or more achievements';
  end if;

  -- Independent definitions avoid duplicate-award constraints. NULL dates
  -- keep this total-limit test separate from the one-daily-award constraint.
  for award_number in (starting_count + 1)..10 loop
    insert into public.achievements
      (title, description, type, emoji, status, is_daily)
    values
      ('Temporary security test', 'Rolled back after test', 'COMMON', '', 'draft', false)
    returning id into test_achievement_id;

    insert into public.user_achievements (user_id, achievement_id)
    values (test_user_id, test_achievement_id);
  end loop;

  if (select count(*) from public.user_achievements
      where user_id = test_user_id) <> 10 then
    raise exception 'FAIL: account did not reach exactly ten awards';
  end if;

  insert into public.achievements
    (title, description, type, emoji, status, is_daily)
  values
    ('Temporary eleventh award', 'Rolled back after test', 'COMMON', '', 'draft', false)
  returning id into test_achievement_id;

  begin
    insert into public.user_achievements (user_id, achievement_id)
    values (test_user_id, test_achievement_id);
  exception when check_violation then
    get stacked diagnostics rejected_constraint = CONSTRAINT_NAME;
    if rejected_constraint <> 'free_achievement_limit'
       or SQLERRM <> 'Free achievement limit reached' then
      raise;
    end if;
    eleventh_rejected := true;
  end;

  if not eleventh_rejected then
    raise exception 'FAIL: the database allowed the eleventh award';
  end if;

  if (select count(*) from public.user_achievements
      where user_id = test_user_id) <> 10 then
    raise exception 'FAIL: unexpected award count after rejected insert';
  end if;
end;
$$;

select 'PASS: tenth award allowed; eleventh rejected by free_achievement_limit' as result;

rollback;
