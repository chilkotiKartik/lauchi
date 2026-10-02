-- lockin. weekly league (opt-in, first name only) and a daily cap for the Ask Lochi AI helper.

-- ------------------------------------------------------------------ league
alter table public.profiles add column league_opt_in boolean not null default false;
grant update (league_opt_in) on public.profiles to authenticated;

-- The board for this week (Monday to Sunday, India time). Only students who chose to join appear, by first name and
-- weekly XP only. The caller always sees their own row. Never exposes ids, emails, branches or last names.
create function public.league_board(p_limit integer default 20) returns table (rank bigint, display text, xp bigint, me boolean)
language sql stable security definer set search_path = public, pg_catalog as $$
  with wk as (select date_trunc('week', now() at time zone 'Asia/Kolkata') as s),
  totals as (
    select p.id, p.name, sum(e.xp)::bigint as xp
    from profiles p join xp_events e on e.user_id = p.id, wk
    where p.league_opt_in and (e.created_at at time zone 'Asia/Kolkata') >= wk.s
    group by p.id, p.name
  ),
  ranked as (select t.*, rank() over (order by t.xp desc) as rk from totals t)
  select r.rk, coalesce(nullif(left(split_part(btrim(r.name), ' ', 1), 14), ''), 'Student'), r.xp, (r.id = auth.uid())
  from ranked r
  where (r.rk <= greatest(1, least(coalesce(p_limit, 20), 50)) or r.id = auth.uid()) and auth.uid() is not null
  order by r.rk, r.name;
$$;
revoke all on function public.league_board(integer) from public, anon;
grant execute on function public.league_board(integer) to authenticated;

-- ------------------------------------------------------------------ AI usage cap
create table public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default ((now() at time zone 'Asia/Kolkata')::date),
  n integer not null default 0 check (n >= 0),
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

-- Counts one request. Returns false (and counts nothing) once the student has used today's allowance.
create function public.bump_ai_usage(p_user uuid, p_limit integer) returns boolean
language plpgsql security definer set search_path = public, pg_catalog as $$
declare used integer;
begin
  insert into ai_usage (user_id, day, n) values (p_user, (now() at time zone 'Asia/Kolkata')::date, 1)
    on conflict (user_id, day) do update set n = ai_usage.n + 1 where ai_usage.n < p_limit
    returning n into used;
  return used is not null;
end $$;
revoke all on function public.bump_ai_usage(uuid, integer) from public, anon, authenticated;
grant execute on function public.bump_ai_usage(uuid, integer) to service_role;
