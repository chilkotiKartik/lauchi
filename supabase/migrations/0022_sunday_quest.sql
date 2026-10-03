-- lockin. Sunday Quest: once a week (Sunday, India time) a 12-question quest built from the units the student practised
-- Monday to Saturday, weighted to the units they got wrong. Like the daily challenge, `items` (template/seed per question)
-- and `answers` are never readable by clients; the server grades every answer and calls sunday_answer().

create table public.sunday_quests (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null check (extract(isodow from day) = 7),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 20),
  units jsonb not null default '[]' check (jsonb_typeof(units) = 'array'),
  answers jsonb not null default '{}',
  score integer,
  xp integer,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.sunday_quests enable row level security;
create policy sunday_select_own on public.sunday_quests for select to authenticated using (user_id = auth.uid());
revoke all on public.sunday_quests from anon, authenticated;
grant select (user_id, day, units, score, xp, completed_at, created_at) on public.sunday_quests to authenticated;
grant all on public.sunday_quests to service_role;

-- Stores one graded answer (the first answer to a question stands). The last answer completes the quest and pays XP once:
-- 10 for finishing, 4 per correct answer, +20 for 80% or better (award_xp ignores a repeated (user, kind, ref)).
create function public.sunday_answer(p_user uuid, p_day date, p_index integer, p_answer jsonb, p_ok boolean) returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare q sunday_quests; n_total integer; n_answered integer; n_ok integer; gained integer; paid integer;
begin
  if p_day <> (now() at time zone 'Asia/Kolkata')::date or extract(isodow from p_day) <> 7 then raise exception 'quest closed'; end if;
  select * into q from sunday_quests where user_id = p_user and day = p_day for update;
  if not found then raise exception 'no quest'; end if;
  if q.completed_at is not null then raise exception 'already completed'; end if;
  n_total := jsonb_array_length(q.items);
  if p_index < 0 or p_index >= n_total then raise exception 'bad index'; end if;
  if not (q.answers ? p_index::text) then
    q.answers := q.answers || jsonb_build_object(p_index::text, jsonb_build_object('a', p_answer, 'ok', p_ok));
  end if;
  select count(*), count(*) filter (where (v ->> 'ok')::boolean) into n_answered, n_ok from jsonb_each(q.answers) e(k, v);
  if n_answered < n_total then
    update sunday_quests set answers = q.answers where user_id = p_user and day = p_day;
    return jsonb_build_object('done', false, 'answered', n_answered, 'total', n_total);
  end if;
  gained := 10 + n_ok * 4 + case when n_ok * 5 >= n_total * 4 then 20 else 0 end;
  paid := award_xp(p_user, 'quiz_completed', 'sunday:' || p_day::text, gained);
  update sunday_quests set answers = q.answers, score = n_ok, xp = paid, completed_at = now() where user_id = p_user and day = p_day;
  return jsonb_build_object('done', true, 'answered', n_answered, 'total', n_total, 'score', n_ok, 'xp', paid);
end $$;
revoke all on function public.sunday_answer(uuid, date, integer, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.sunday_answer(uuid, date, integer, jsonb, boolean) to service_role;

-- ------------------------------------------------------------------ reminders: Saturday "prepare" and Sunday "it's open"
alter table public.push_subscriptions add column if not exists last_sunday_on date;

create or replace function public.reminders_due(p_now timestamptz default now())
returns table (sub_id uuid, user_id uuid, endpoint text, p256dh text, auth text, kind text, streak integer, days_left integer, local_day date)
language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare r record; tz text; local_ts timestamp; today date; n integer; india date := (p_now at time zone 'Asia/Kolkata')::date;
begin
  for r in
    select s.*, p.timezone as tz_name, p.exam_date
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
      n := (select c.streak from streak_calc(r.user_id, tz) c);
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

    if r.remind_streak and extract(hour from local_ts) >= 17 and extract(hour from local_ts) < 22 and r.last_daily_on is distinct from today
       and not exists (select 1 from daily_challenges d where d.user_id = r.user_id and d.day = india and d.completed_at is not null) then
      sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
      kind := 'daily'; streak := (select c.streak from streak_calc(r.user_id, tz) c); days_left := null; local_day := today;
      return next;
    end if;

    -- Sunday Quest (India days): Saturday 18:00–22:00 "prepare for tomorrow", Sunday 09:00–21:00 "your quest is open"
    if r.remind_streak and r.last_sunday_on is distinct from today then
      if extract(isodow from india) = 6 and extract(hour from local_ts) between 18 and 21 then
        sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
        kind := 'sunday_prep'; streak := null; days_left := 1; local_day := today;
        return next;
      elsif extract(isodow from india) = 7 and extract(hour from local_ts) between 9 and 20
        and not exists (select 1 from sunday_quests q where q.user_id = r.user_id and q.day = india and q.completed_at is not null) then
        sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
        kind := 'sunday'; streak := null; days_left := 0; local_day := today;
        return next;
      end if;
    end if;
  end loop;
end $$;
revoke all on function public.reminders_due(timestamptz) from public, anon, authenticated;
grant execute on function public.reminders_due(timestamptz) to service_role;
