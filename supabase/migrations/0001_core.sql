-- lockin. core: profiles, trusted XP ledger, dashboard stats.
-- Every table has RLS. XP can only be written by SECURITY DEFINER functions (never by clients).

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text not null default '' check (char_length(name) <= 60),
  branch text check (branch in ('CSE','CSE-DS','ECE','EE','ME','CE')),
  year smallint check (year = 1),
  semester smallint check (semester in (1, 2)),
  daily_goal_xp integer not null default 50 check (daily_goal_xp between 10 and 500),
  timezone text not null default 'Asia/Kolkata',
  language text not null default 'en' check (language in ('en','hi')),
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create function public.validate_profile() returns trigger
language plpgsql set search_path = public, pg_catalog as $$
begin
  -- Accept IANA names including legacy aliases browsers still report (e.g. Asia/Calcutta), reject abbreviations like IST.
  if new.timezone <> 'UTC' and new.timezone !~ '^[A-Za-z_]+(/[A-Za-z0-9_+-]+){1,2}$' then
    raise exception 'invalid timezone';
  end if;
  begin
    perform now() at time zone new.timezone;
  exception when others then
    raise exception 'invalid timezone';
  end;
  new.name := btrim(new.name);
  if new.onboarded_at is not null and (char_length(new.name) < 1 or new.branch is null or new.year is null or new.semester is null) then
    raise exception 'onboarding needs name, branch, year and semester';
  end if;
  return new;
end $$;
create trigger profiles_validate before insert or update on public.profiles
  for each row execute function public.validate_profile();

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email,
          left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), 60))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, branch, year, semester, daily_goal_xp, timezone, language, onboarded_at) on public.profiles to authenticated;

-- ------------------------------------------------------------------ XP ledger
create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('topic_completed','quiz_completed','practical_completed','mock_completed','daily_goal_completed')),
  ref text not null check (char_length(ref) between 1 and 120),
  xp integer not null check (xp between 1 and 200),
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref)
);
create index xp_events_user_time on public.xp_events (user_id, created_at desc);
alter table public.xp_events enable row level security;
create policy xp_events_select_own on public.xp_events for select to authenticated using (user_id = auth.uid());
revoke all on public.xp_events from anon, authenticated;
grant select on public.xp_events to authenticated;

-- Internal only: called by other trusted functions after they verify the work. Not callable by clients.
-- Duplicate (user, kind, ref) is ignored, so refreshing or replaying never pays twice.
-- A per-day cap stops any single bug or exploit from inflating XP.
create function public.award_xp(p_user uuid, p_kind text, p_ref text, p_xp integer) returns integer
language plpgsql security definer set search_path = public, pg_catalog as $$
declare tz text; today_total integer; granted integer;
begin
  select timezone into tz from profiles where id = p_user;
  if tz is null then raise exception 'unknown user'; end if;
  select coalesce(sum(xp), 0) into today_total from xp_events
    where user_id = p_user and (created_at at time zone tz)::date = (now() at time zone tz)::date;
  granted := least(p_xp, greatest(0, 1500 - today_total));
  if granted <= 0 then return 0; end if;
  insert into xp_events (user_id, kind, ref, xp) values (p_user, p_kind, p_ref, granted)
    on conflict (user_id, kind, ref) do nothing;
  if not found then return 0; end if;
  return granted;
end $$;
revoke all on function public.award_xp(uuid, text, text, integer) from public, anon, authenticated;

-- ------------------------------------------------------------------ dashboard stats
-- security invoker: RLS applies, a caller only ever sees their own rows. Streak is computed here, in the
-- student's own timezone, never on the client.
create function public.dashboard_stats() returns jsonb
language plpgsql stable security invoker set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); tz text; today date; total bigint; today_xp bigint; streak int := 0; cursor date; week jsonb;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select timezone into tz from profiles where id = uid;
  if tz is null then raise exception 'no profile'; end if;
  today := (now() at time zone tz)::date;
  select coalesce(sum(xp), 0) into total from xp_events where user_id = uid;
  select coalesce(sum(xp), 0) into today_xp from xp_events where user_id = uid and (created_at at time zone tz)::date = today;
  cursor := today;
  if not exists (select 1 from xp_events where user_id = uid and (created_at at time zone tz)::date = today) then cursor := today - 1; end if;
  while exists (select 1 from xp_events where user_id = uid and (created_at at time zone tz)::date = cursor) loop
    streak := streak + 1; cursor := cursor - 1;
  end loop;
  select coalesce(jsonb_object_agg(d, s), '{}') into week from (
    select (created_at at time zone tz)::date d, sum(xp) s from xp_events
    where user_id = uid and (created_at at time zone tz)::date > today - 84 group by 1) t;
  return jsonb_build_object('total_xp', total, 'today_xp', today_xp, 'streak', streak, 'today', today, 'days', week);
end $$;
revoke all on function public.dashboard_stats() from public, anon;
grant execute on function public.dashboard_stats() to authenticated;

-- ------------------------------------------------------------------ consent records (DPDP)
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_version text not null check (char_length(policy_version) between 1 and 20),
  accepted_at timestamptz not null default now(),
  unique (user_id, policy_version)
);
alter table public.consents enable row level security;
create policy consents_select_own on public.consents for select to authenticated using (user_id = auth.uid());
revoke all on public.consents from anon, authenticated;
grant select on public.consents to authenticated;

create function public.record_consent(p_version text) returns void
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into consents (user_id, policy_version) values (auth.uid(), p_version) on conflict do nothing;
end $$;
revoke all on function public.record_consent(text) from public, anon;
grant execute on function public.record_consent(text) to authenticated;
