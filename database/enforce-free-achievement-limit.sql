-- Run in the Supabase SQL Editor. Existing awards are preserved.
begin;

create or replace function public.enforce_free_achievement_limit()
returns trigger
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  if TG_OP = 'UPDATE' then
    if NEW.user_id is not distinct from OLD.user_id then
      return NEW;
    end if;
  end if;

  -- Serialize awards for this account. The no-op write also ensures a
  -- stale REPEATABLE READ transaction fails instead of using an old count.
  update public.profiles
  set timezone = timezone
  where id = NEW.user_id;

  if not found then
    raise exception 'Achievement owner must have a profile'
      using errcode = '23503';
  end if;

  -- Keep these statuses and the limit aligned with entitlement-service-server.ts.
  if exists (
    select 1 from public.subscriptions
    where user_id = NEW.user_id
      and status in ('active', 'trialing', 'past_due')
  ) then
    return NEW;
  end if;

  if (select count(*) from public.user_achievements
      where user_id = NEW.user_id) >= 10 then
    raise exception 'Free achievement limit reached'
      using errcode = '23514', constraint = 'free_achievement_limit';
  end if;

  return NEW;
end;
$$;

revoke all on function public.enforce_free_achievement_limit()
from public, anon, authenticated;

drop trigger if exists enforce_free_achievement_limit
on public.user_achievements;

create trigger enforce_free_achievement_limit
before insert or update of user_id on public.user_achievements
for each row execute function public.enforce_free_achievement_limit();

commit;
