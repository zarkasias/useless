-- Run this ENTIRE file together in Supabase SQL Editor.
-- Simulated subscription records and test awards are never committed.
-- This script does not contact Stripe.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
declare
  test_user_id uuid;
  test_achievement_id uuid;
  starting_count integer;
  award_number integer;
  test_status text;
  rejected_constraint text;
  rejected boolean;
begin
  select id into strict test_user_id
  from public.profiles
  where username = 'achievemaster' and role = 'user'
  for update;

  if exists (
    select 1 from public.subscriptions
    where user_id = test_user_id
      and status in ('active', 'trialing', 'past_due')
  ) then
    raise exception 'Use the free test account, not a subscribed account';
  end if;

  select count(*) into starting_count
  from public.user_achievements where user_id = test_user_id;

  if starting_count > 10 then
    raise exception 'Test account already has more than ten awards';
  end if;

  for award_number in (starting_count + 1)..10 loop
    insert into public.achievements
      (title, description, type, emoji, status, is_daily)
    values
      ('Temporary subscription test', 'Rolled back after test', 'COMMON', '', 'draft', false)
    returning id into test_achievement_id;

    insert into public.user_achievements (user_id, achievement_id)
    values (test_user_id, test_achievement_id);
  end loop;

  foreach test_status in array array['active', 'trialing', 'past_due'] loop
    insert into public.subscriptions (user_id, provider, status)
    values (test_user_id, 'stripe', test_status)
    on conflict (user_id) do update set status = excluded.status;

    insert into public.achievements
      (title, description, type, emoji, status, is_daily)
    values
      ('Temporary subscription exception test', 'Rolled back after test', 'COMMON', '', 'draft', false)
    returning id into test_achievement_id;

    insert into public.user_achievements (user_id, achievement_id)
    values (test_user_id, test_achievement_id);
  end loop;

  if (select count(*) from public.user_achievements
      where user_id = test_user_id) <> 13 then
    raise exception 'FAIL: subscribed statuses did not allow all three extra awards';
  end if;

  foreach test_status in array array['canceled', 'unpaid', 'inactive'] loop
    update public.subscriptions set status = test_status
    where user_id = test_user_id;

    insert into public.achievements
      (title, description, type, emoji, status, is_daily)
    values
      ('Temporary expired subscription test', 'Rolled back after test', 'COMMON', '', 'draft', false)
    returning id into test_achievement_id;

    rejected := false;
    begin
      insert into public.user_achievements (user_id, achievement_id)
      values (test_user_id, test_achievement_id);
    exception when check_violation then
      get stacked diagnostics rejected_constraint = CONSTRAINT_NAME;
      if rejected_constraint <> 'free_achievement_limit'
         or SQLERRM <> 'Free achievement limit reached' then
        raise;
      end if;
      rejected := true;
    end;

    if not rejected then
      raise exception 'FAIL: status % allowed an award above the limit', test_status;
    end if;
  end loop;

  if (select count(*) from public.user_achievements
      where user_id = test_user_id) <> 13 then
    raise exception 'FAIL: existing awards were not preserved';
  end if;
end;
$$;

select 'PASS: active/trialing/past_due allow extra awards; canceled/unpaid/inactive block extras; existing awards preserved' as result;

rollback;
