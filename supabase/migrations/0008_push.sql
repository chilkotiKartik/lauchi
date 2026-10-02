-- lockin. Web Push: one row per browser a student switched reminders on in, and the query the cron job uses to find who is due.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) between 20 and 1000 and endpoint like 'https://%'),
  p256dh text not null check (char_length(p256dh) between 20 and 200),
  auth text not null check (char_length(auth) between 8 and 100),
  remind_streak boolean not null default true,
  remind_exam boolean not null default true,
  study_time time,                       -- optional daily study reminder, in the student's own time zone
  last_streak_on date,                   -- local date of the last reminder of each kind, so we send at most one a day
  last_exam_on date,
  last_study_on date,
  created timestamptz not null default now(),
  last_ok timestamptz
);
create index push_subscriptions_user on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
grant select, delete on public.push_subscriptions to authenticated;
create policy push_select_own on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy push_delete_own on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());
-- Inserts and updates go through the API with the service role (an endpoint can move between students on a shared phone).

-- Who should get a reminder right now? One row per (subscription, kind). Never callable by students.
--   streak: a streak of 1+ days that has no XP yet today, from 18:00 local time
--   exam:   exam_date is exactly 7 days or 1 day away, from 08:00 local time
--   study:  the chosen daily study time has passed (within the last 3 hours)
create function public.reminders_due(p_now timestamptz default now())
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
  end loop;
end $$;
revoke all on function public.reminders_due(timestamptz) from public, anon, authenticated;
grant execute on function public.reminders_due(timestamptz) to service_role;
