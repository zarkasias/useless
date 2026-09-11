-- Run the entire file while session A is in its 30-second wait.
begin;
set local lock_timeout = '2s';
set local statement_timeout = '10s';

do $$
declare
  test_user_id uuid;
  test_achievement_id uuid;
  error_context text;
  waited_for_guard boolean := false;
begin
  select id into strict test_user_id
  from public.profiles
  where username = 'achievemaster' and role = 'user';

  insert into public.achievements
    (title, description, type, emoji, status, is_daily)
  values
    ('Temporary concurrency test', 'Rolled back after test', 'COMMON', '', 'draft', false)
  returning id into test_achievement_id;

  begin
    insert into public.user_achievements (user_id, achievement_id)
    values (test_user_id, test_achievement_id);
  exception when lock_not_available then
    get stacked diagnostics error_context = PG_EXCEPTION_CONTEXT;
    if position('enforce_free_achievement_limit' in error_context) = 0 then
      raise;
    end if;
    waited_for_guard := true;
  end;

  if not waited_for_guard then
    raise exception 'No guard lock wait observed. Run B while A is still waiting, then retry.';
  end if;
end;
$$;

select 'PASS: the award guard waits for the account lock held by another transaction' as result;

rollback;
