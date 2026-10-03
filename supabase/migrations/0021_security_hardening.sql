-- lockin. security hardening.
-- 1. Undo 0020: the quiz write functions trust p_user and p_correct, so they must only ever be called by the Next.js server
--    (service role) after it has verified the signed-in user and graded the answer itself. Granting them to `authenticated`
--    let any student call them through the REST API with p_correct = true (free XP, league rank, topic completions) or with
--    another student's id.
-- 2. One streak rule everywhere: class rosters and streak reminders now honour streak freezes, like the dashboard and friends.
-- 3. Limits that used to live only in app code are enforced in the database too (doubts per day, exam tasks per student).

-- ------------------------------------------------------------------ 1. quiz write path: service role only
revoke execute on function public.start_quiz_session(uuid, text, integer, integer, text, text, integer) from public, anon, authenticated;
revoke execute on function public.record_answer(uuid, uuid, integer, jsonb, boolean) from public, anon, authenticated;
revoke execute on function public.record_answer_tagged(uuid, uuid, integer, jsonb, boolean, integer, integer, integer) from public, anon, authenticated;
revoke execute on function public.finish_quiz_session(uuid, uuid) from public, anon, authenticated;
grant execute on function public.start_quiz_session(uuid, text, integer, integer, text, text, integer) to service_role;
grant execute on function public.record_answer(uuid, uuid, integer, jsonb, boolean) to service_role;
grant execute on function public.record_answer_tagged(uuid, uuid, integer, jsonb, boolean, integer, integer, integer) to service_role;
grant execute on function public.finish_quiz_session(uuid, uuid) to service_role;

-- ------------------------------------------------------------------ 2. one streak rule
create or replace function public.class_streak(p_user uuid, p_tz text) returns integer
language sql stable set search_path = public, pg_catalog as $$
  select streak from streak_calc(p_user, p_tz)
$$;
revoke all on function public.class_streak(uuid, text) from public, anon, authenticated;
grant execute on function public.class_streak(uuid, text) to service_role;

create or replace function public.reminders_due(p_now timestamptz default now())
returns table (sub_id uuid, user_id uuid, endpoint text, p256dh text, auth text, kind text, streak integer, days_left integer, local_day date)
language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare r record; tz text; local_ts timestamp; today date; n integer;
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

    -- a live streak (freezes included) with no XP yet today, from 18:00 local time
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
       and not exists (select 1 from daily_challenges d where d.user_id = r.user_id and d.day = (p_now at time zone 'Asia/Kolkata')::date and d.completed_at is not null) then
      sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
      kind := 'daily'; streak := (select c.streak from streak_calc(r.user_id, tz) c); days_left := null; local_day := today;
      return next;
    end if;
  end loop;
end $$;
revoke all on function public.reminders_due(timestamptz) from public, anon, authenticated;
grant execute on function public.reminders_due(timestamptz) to service_role;

-- ------------------------------------------------------------------ 3. limits in the database
-- At most 10 doubts per student in any 24 hours (the server checks too; this closes direct inserts and double submits).
create or replace function public.doubts_limit() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  perform pg_advisory_xact_lock(hashtext('doubts:' || new.user_id::text));
  if (select count(*) from doubts where user_id = new.user_id and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'too many doubts today';
  end if;
  return new;
end $$;
revoke all on function public.doubts_limit() from public, anon, authenticated;
drop trigger if exists doubts_limit on public.doubts;
create trigger doubts_limit before insert on public.doubts for each row execute function public.doubts_limit();

-- At most 2000 exam tasks per student (a full schedule is well under 1000), so the table cannot be used as free storage.
create or replace function public.exam_tasks_limit() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if (select count(*) from exam_tasks where user_id = new.user_id) >= 2000 then
    raise exception 'too many exam tasks';
  end if;
  return new;
end $$;
revoke all on function public.exam_tasks_limit() from public, anon, authenticated;
drop trigger if exists exam_tasks_limit on public.exam_tasks;
create trigger exam_tasks_limit before insert on public.exam_tasks for each row execute function public.exam_tasks_limit();

-- Only one AI first answer per doubt, even when the button is pressed twice at once. Older duplicates keep the first one.
delete from public.doubt_answers a using public.doubt_answers b
  where a.author_kind = 'ai' and b.author_kind = 'ai' and a.doubt_id = b.doubt_id
    and (a.created_at, a.id) > (b.created_at, b.id);
create unique index if not exists doubt_answers_one_ai on public.doubt_answers (doubt_id) where author_kind = 'ai';
