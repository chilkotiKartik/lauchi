-- lockin. Daily 5-question challenge, streak freezes, weekly goals and the "daily" push reminder.

-- ------------------------------------------------------------------ daily challenge
-- One row per student per India day. `items` (which template/seed each question comes from) and `answers` are never
-- readable by clients; the server grades and calls daily_answer().
create table public.daily_challenges (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 10),
  answers jsonb not null default '{}',
  score integer,
  xp integer,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.daily_challenges enable row level security;
create policy daily_select_own on public.daily_challenges for select to authenticated using (user_id = auth.uid());
revoke all on public.daily_challenges from anon, authenticated;
grant select (user_id, day, score, xp, completed_at, created_at) on public.daily_challenges to authenticated;

-- Stores one graded answer. The first answer to a question stands. When the last one arrives the challenge completes
-- and pays XP once (award_xp ignores a repeated (user, kind, ref)).
create function public.daily_answer(p_user uuid, p_day date, p_index integer, p_answer jsonb, p_ok boolean) returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare c daily_challenges; n_total integer; n_answered integer; n_ok integer; gained integer := 0; paid integer;
begin
  if p_day <> (now() at time zone 'Asia/Kolkata')::date then raise exception 'wrong day'; end if;
  select * into c from daily_challenges where user_id = p_user and day = p_day for update;
  if not found then raise exception 'no challenge'; end if;
  if c.completed_at is not null then raise exception 'already completed'; end if;
  n_total := jsonb_array_length(c.items);
  if p_index < 0 or p_index >= n_total then raise exception 'bad index'; end if;
  if not (c.answers ? p_index::text) then
    c.answers := c.answers || jsonb_build_object(p_index::text, jsonb_build_object('a', p_answer, 'ok', p_ok));
  end if;
  select count(*), count(*) filter (where (v ->> 'ok')::boolean) into n_answered, n_ok from jsonb_each(c.answers) e(k, v);
  if n_answered < n_total then
    update daily_challenges set answers = c.answers where user_id = p_user and day = p_day;
    return jsonb_build_object('done', false, 'answered', n_answered, 'total', n_total);
  end if;
  gained := 5 + n_ok * 4 + case when n_ok = n_total then 10 else 0 end;
  paid := award_xp(p_user, 'quiz_completed', 'daily:' || p_day::text, gained);
  update daily_challenges set answers = c.answers, score = n_ok, xp = paid, completed_at = now() where user_id = p_user and day = p_day;
  return jsonb_build_object('done', true, 'answered', n_answered, 'total', n_total, 'score', n_ok, 'xp', paid);
end $$;
revoke all on function public.daily_answer(uuid, date, integer, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.daily_answer(uuid, date, integer, jsonb, boolean) to service_role;

-- ------------------------------------------------------------------ streak freezes
-- Replay rule (the only place it lives; src/lib/streak.ts mirrors it for tests): walk the days up to yesterday.
-- An active day (XP > 0) adds 1 to the run and every 7th run day banks a freeze (max 2). A missed day spends a
-- banked freeze if the run is alive, otherwise the run resets to 0. Today never costs a freeze.
create table public.streak_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  checked_through date not null,
  run integer not null default 0,
  banked integer not null default 0 check (banked between 0 and 2)
);
alter table public.streak_state enable row level security;
create policy streak_state_select_own on public.streak_state for select to authenticated using (user_id = auth.uid());
revoke all on public.streak_state from anon, authenticated;
grant select on public.streak_state to authenticated;

create table public.streak_freezes (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);
alter table public.streak_freezes enable row level security;
create policy streak_freezes_select_own on public.streak_freezes for select to authenticated using (user_id = auth.uid());
revoke all on public.streak_freezes from anon, authenticated;
grant select on public.streak_freezes to authenticated;

create function public.streak_calc(p_user uuid, p_tz text)
returns table (streak integer, freezes integer, ck_day date, ck_run integer, ck_banked integer, frozen date[])
language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare st streak_state; today date := (now() at time zone p_tz)::date; d date; run integer := 0; banked integer := 0;
        days date[]; fr date[] := '{}'; first_day date; today_on boolean;
begin
  select * into st from streak_state where user_id = p_user;
  if found then d := st.checked_through + 1; run := st.run; banked := st.banked;
  else
    select min((created_at at time zone p_tz)::date) into first_day from xp_events where user_id = p_user and xp > 0;
    if first_day is null then
      streak := 0; freezes := 0; ck_day := today - 1; ck_run := 0; ck_banked := 0; frozen := fr; return next; return;
    end if;
    d := greatest(first_day, today - 400);
  end if;
  select coalesce(array_agg(distinct (created_at at time zone p_tz)::date), '{}') into days
    from xp_events where user_id = p_user and xp > 0 and (created_at at time zone p_tz)::date >= d;
  while d < today loop
    if d = any(days) then
      run := run + 1;
      if run % 7 = 0 then banked := least(2, banked + 1); end if;
    elsif run > 0 and banked > 0 then
      banked := banked - 1; fr := fr || d;
    else
      run := 0;
    end if;
    d := d + 1;
  end loop;
  today_on := today = any(days);
  streak := run + case when today_on then 1 else 0 end;
  freezes := least(2, banked + case when today_on and (run + 1) % 7 = 0 then 1 else 0 end);
  ck_day := today - 1; ck_run := run; ck_banked := banked; frozen := fr;
  return next;
end $$;
revoke all on function public.streak_calc(uuid, text) from public, anon, authenticated;
grant execute on function public.streak_calc(uuid, text) to service_role;

-- Saves the checkpoint and the freeze days that were spent. Idempotent: running it twice in a day changes nothing.
create function public.sync_streak(p_user uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare tz text; c record; fd date;
begin
  select timezone into tz from profiles where id = p_user;
  if tz is null then raise exception 'unknown user'; end if;
  select * into c from streak_calc(p_user, tz);
  if exists (select 1 from xp_events where user_id = p_user and xp > 0) then
    insert into streak_state (user_id, checked_through, run, banked) values (p_user, c.ck_day, c.ck_run, c.ck_banked)
      on conflict (user_id) do update set checked_through = excluded.checked_through, run = excluded.run, banked = excluded.banked
      where streak_state.checked_through < excluded.checked_through;
    foreach fd in array c.frozen loop
      insert into streak_freezes (user_id, day) values (p_user, fd) on conflict do nothing;
    end loop;
  end if;
  return jsonb_build_object('streak', c.streak, 'freezes', c.freezes);
end $$;
revoke all on function public.sync_streak(uuid) from public, anon, authenticated;
grant execute on function public.sync_streak(uuid) to service_role;

-- Same output as before plus `freezes`; the streak now honours freezes. Persists the checkpoint (idempotent per day).
create or replace function public.dashboard_stats() returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); tz text; today date; total bigint; today_xp bigint; week jsonb; c record;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select timezone into tz from profiles where id = uid;
  if tz is null then raise exception 'no profile'; end if;
  today := (now() at time zone tz)::date;
  select coalesce(sum(xp), 0) into total from xp_events where user_id = uid;
  select coalesce(sum(xp), 0) into today_xp from xp_events where user_id = uid and (created_at at time zone tz)::date = today;
  select * into c from streak_calc(uid, tz);
  if not exists (select 1 from streak_state where user_id = uid and checked_through >= c.ck_day) then perform sync_streak(uid); end if;
  select coalesce(jsonb_object_agg(d, s), '{}') into week from (
    select (created_at at time zone tz)::date d, sum(xp) s from xp_events
    where user_id = uid and (created_at at time zone tz)::date > today - 84 group by 1) t;
  return jsonb_build_object('total_xp', total, 'today_xp', today_xp, 'streak', c.streak, 'freezes', c.freezes, 'today', today, 'days', week);
end $$;
revoke all on function public.dashboard_stats() from public, anon;
grant execute on function public.dashboard_stats() to authenticated;

-- Friends and groups show the same streak number.
create or replace function public.social_streak(p_user uuid, p_tz text) returns integer
language sql stable set search_path = public, pg_catalog as $$
  select streak from streak_calc(p_user, p_tz)
$$;

-- ------------------------------------------------------------------ weekly goals
create table public.weekly_goals (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  xp_target integer not null check (xp_target between 10 and 5000),
  quizzes_target integer not null check (quizzes_target between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);
alter table public.weekly_goals enable row level security;
create policy weekly_goals_select_own on public.weekly_goals for select to authenticated using (user_id = auth.uid());
revoke all on public.weekly_goals from anon, authenticated;
grant select on public.weekly_goals to authenticated;
-- Writes go through the server action (service role) after zod validation.

-- XP and finished quizzes (quiz sessions + daily challenges) per India week (Mon-Sun) from p_from (a Monday) on.
create function public.weekly_progress(p_user uuid, p_from date) returns table (week_start date, xp bigint, quizzes bigint)
language sql stable security definer set search_path = public, pg_catalog as $$
  with x as (
    select date_trunc('week', (created_at at time zone 'Asia/Kolkata'))::date as w, sum(xp)::bigint as xp
    from xp_events where user_id = p_user and (created_at at time zone 'Asia/Kolkata')::date >= p_from group by 1
  ), q as (
    select w, count(*)::bigint as n from (
      select date_trunc('week', (submitted_at at time zone 'Asia/Kolkata'))::date as w from quiz_sessions
        where user_id = p_user and submitted_at is not null and (submitted_at at time zone 'Asia/Kolkata')::date >= p_from
      union all
      select date_trunc('week', day::timestamp)::date from daily_challenges
        where user_id = p_user and completed_at is not null and day >= p_from
    ) t group by w
  )
  select coalesce(x.w, q.w), coalesce(x.xp, 0), coalesce(q.n, 0) from x full join q on q.w = x.w order by 1
$$;
revoke all on function public.weekly_progress(uuid, date) from public, anon, authenticated;
grant execute on function public.weekly_progress(uuid, date) to service_role;

-- ------------------------------------------------------------------ push: "daily" reminder at 17:00 local
alter table public.push_subscriptions add column last_daily_on date;

create or replace function public.reminders_due(p_now timestamptz default now())
returns table (sub_id uuid, user_id uuid, endpoint text, p256dh text, auth text, kind text, streak integer, days_left integer, local_day date)
language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare r record; tz text; local_ts timestamp; today date; cur date; n integer;
begin
  for r in
    select s.*, p.timezone as tz_name, p.exam_date, p.name as pname
    from push_subscriptions s join profiles p on p.id = s.user_id
    where p.onboarded_at is not null
  loop
    begin
      tz := coalesce(nullif(r.tz_name, ''), 'Asia/Kolkata');
      local_ts := p_now at time zone tz;
    exception when others then
      tz := 'Asia/Kolkata'; local_ts := p_now at time zone tz;
    end;
    today := local_ts::date;

    if r.remind_streak and extract(hour from local_ts) >= 18 and r.last_streak_on is distinct from today
       and not exists (select 1 from xp_events e where e.user_id = r.user_id and (e.created_at at time zone tz)::date = today) then
      n := 0; cur := today - 1;
      while exists (select 1 from xp_events e where e.user_id = r.user_id and (e.created_at at time zone tz)::date = cur) loop
        n := n + 1; cur := cur - 1;
      end loop;
      if n > 0 then
        sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
        kind := 'streak'; streak := n; days_left := null; local_day := today;
        return next;
      end if;
    end if;

    if r.remind_exam and r.exam_date is not null and extract(hour from local_ts) >= 8 and r.last_exam_on is distinct from today
       and (r.exam_date - today) in (1, 7) then
      sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
      kind := 'exam'; streak := null; days_left := r.exam_date - today; local_day := today;
      return next;
    end if;

    if r.study_time is not null and r.last_study_on is distinct from today
       and local_ts::time >= r.study_time and local_ts::time < r.study_time + interval '3 hours' and r.study_time < time '21:00' then
      sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
      kind := 'study'; streak := null; days_left := null; local_day := today;
      return next;
    end if;

    -- today's 5-question challenge is not finished: from 17:00 to 22:00, once a day (rides on the streak reminder switch)
    if r.remind_streak and extract(hour from local_ts) >= 17 and extract(hour from local_ts) < 22 and r.last_daily_on is distinct from today
       and not exists (select 1 from daily_challenges d where d.user_id = r.user_id and d.day = (p_now at time zone 'Asia/Kolkata')::date and d.completed_at is not null) then
      sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
      kind := 'daily'; streak := (select c.streak from streak_calc(r.user_id, tz) c); days_left := null; local_day := today;
      return next;
    end if;
  end loop;
end $$;
revoke all on function public.reminders_due(timestamptz) from public, anon, authenticated;
grant execute on function public.reminders_due(timestamptz) to service_role;
