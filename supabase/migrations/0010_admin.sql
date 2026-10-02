-- lockin. admin panel: admins, teacher-added PYQs, pinned ("Teacher's pick") videos, question reports and anonymous analytics.
--
-- HOW TO MAKE SOMEONE AN ADMIN (nobody is an admin by default):
--   1. They sign in to lockin. once, so their account exists.
--   2. In the Supabase SQL editor run:
--        insert into public.admins (user_id) select id from auth.users where email = 'teacher@example.com';
--      To remove them:  delete from public.admins where user_id = (select id from auth.users where email = 'teacher@example.com');
--   Or, without SQL: set the server env var ADMIN_EMAILS to a comma-separated list of emails (e.g. "a@x.com,b@y.com").
-- The Next.js server re-checks admin rights on every admin page and every admin action (non-admins get a 404).
-- Admin writes go through the service-role client only after that check; students can never write these tables.

-- ------------------------------------------------------------------ admins
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- a signed-in user can only ever see whether they themselves are an admin
create policy admins_select_own on public.admins for select to authenticated using (user_id = auth.uid());
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;
grant all on public.admins to service_role;

-- ------------------------------------------------------------------ custom PYQs
create table public.custom_pyqs (
  id uuid primary key default gen_random_uuid(),
  course text not null check (course ~ '^[A-Z]{2,3}-[0-9]{3}$'),
  unit smallint not null check (unit between 1 and 12),
  kind text not null check (kind in ('theory', 'numerical')),
  title text not null check (char_length(title) between 1 and 300),
  parts jsonb not null default '[]' check (jsonb_typeof(parts) = 'array' and jsonb_array_length(parts) between 1 and 12),
  marks text check (marks is null or char_length(marks) <= 20),
  repeated integer not null default 1 check (repeated between 0 and 50),
  year text check (year is null or char_length(year) <= 60),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  hidden boolean not null default false
);
create index custom_pyqs_course_unit on public.custom_pyqs (course, unit);
alter table public.custom_pyqs enable row level security;
create policy custom_pyqs_select_visible on public.custom_pyqs for select to authenticated using (not hidden);
revoke all on public.custom_pyqs from anon, authenticated;
grant select on public.custom_pyqs to authenticated;
grant all on public.custom_pyqs to service_role;

-- ------------------------------------------------------------------ pinned videos
create table public.pinned_videos (
  id uuid primary key default gen_random_uuid(),
  course text not null check (course ~ '^[A-Z]{2,3}-[0-9]{3}$'),
  unit smallint not null check (unit between 1 and 12),
  topic text check (topic is null or topic ~ '^[0-9]{1,3}$'),
  video_id text not null check (video_id ~ '^[A-Za-z0-9_-]{11}$'),
  title text not null check (char_length(title) between 1 and 140),
  channel text not null default '' check (char_length(channel) <= 80),
  note text not null default '' check (char_length(note) <= 200),
  position integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index pinned_videos_course_unit on public.pinned_videos (course, unit, position);
alter table public.pinned_videos enable row level security;
create policy pinned_videos_select_all on public.pinned_videos for select to authenticated using (true);
revoke all on public.pinned_videos from anon, authenticated;
grant select on public.pinned_videos to authenticated;
grant all on public.pinned_videos to service_role;

-- ------------------------------------------------------------------ question reports
create table public.question_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('quiz', 'pyq', 'lesson')),
  ref text not null check (char_length(ref) between 1 and 200),
  course text check (course is null or course ~ '^[A-Z]{2,3}-[0-9]{3}$'),
  unit smallint check (unit is null or unit between 1 and 12),
  text text not null check (char_length(text) between 1 and 500),
  status text not null default 'open' check (status in ('open', 'fixed', 'ignored')),
  fix_note text not null default '' check (char_length(fix_note) <= 500),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index question_reports_status_time on public.question_reports (status, created_at desc);
create index question_reports_user_time on public.question_reports (user_id, created_at desc);
alter table public.question_reports enable row level security;
create policy question_reports_select_own on public.question_reports for select to authenticated using (user_id = auth.uid());
revoke all on public.question_reports from anon, authenticated;
grant select (id, source, ref, course, unit, text, status, created_at) on public.question_reports to authenticated;
grant all on public.question_reports to service_role;

-- A signed-in student files a report. At most p_limit per student per day (India time). Returns false once the limit is hit.
create function public.submit_question_report(p_source text, p_ref text, p_course text, p_unit integer, p_text text, p_limit integer default 20)
returns boolean language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); used integer;
begin
  if uid is null then raise exception 'not signed in'; end if;
  perform pg_advisory_xact_lock(hashtext('question_reports:' || uid::text));
  select count(*) into used from question_reports
    where user_id = uid and (created_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date;
  if used >= least(greatest(coalesce(p_limit, 20), 1), 20) then return false; end if;
  insert into question_reports (user_id, source, ref, course, unit, text) values (uid, p_source, btrim(p_ref), p_course, p_unit, btrim(p_text));
  return true;
end $$;
revoke all on function public.submit_question_report(text, text, text, integer, text, integer) from public, anon;
grant execute on function public.submit_question_report(text, text, text, integer, text, integer) to authenticated, service_role;

-- ------------------------------------------------------------------ anonymous analytics
-- Aggregates only. Any group with fewer than 5 distinct students is left out (k-anonymity), and no ids, names or
-- emails ever leave this function. Callable only by the service role (the Next.js server calls it after isAdmin()).
create function public.admin_analytics(p_days integer default 7) returns jsonb
language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare d integer := least(greatest(coalesce(p_days, 7), 1), 90); since timestamptz; k constant integer := 5; units jsonb; days jsonb; reports jsonb; totals jsonb;
begin
  since := (date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata') - make_interval(days => d - 1);

  with a as (
    -- mock sessions span units: each answer then records its own unit in 'u'
    select s.course, case when e.value->>'u' ~ '^[0-9]{1,2}$' then (e.value->>'u')::integer else s.unit end as unit, s.user_id, coalesce((e.value->>'ok')::boolean, false) as ok
    from quiz_sessions s cross join lateral jsonb_each(s.answers) e
    where s.created_at >= since and jsonb_typeof(e.value) = 'object'
  ), g as (
    select course, unit, count(distinct user_id) as students, count(*) as attempts, count(*) filter (where ok) as correct
    from a group by course, unit
  )
  select coalesce(jsonb_agg(jsonb_build_object('course', course, 'unit', unit, 'students', students, 'attempts', attempts,
           'correct', correct, 'accuracy', round(100.0 * correct / attempts)) order by (1.0 * correct / attempts), attempts desc, course, unit), '[]')
    into units from g where students >= k and attempts > 0;

  with act as (
    select user_id, (created_at at time zone 'Asia/Kolkata')::date as day from quiz_sessions where created_at >= since
    union
    select user_id, (created_at at time zone 'Asia/Kolkata')::date from xp_events where created_at >= since
  ), per as (select day, count(distinct user_id) as n from act group by day),
  series as (select generate_series((since at time zone 'Asia/Kolkata')::date, (now() at time zone 'Asia/Kolkata')::date, interval '1 day')::date as day)
  select coalesce(jsonb_agg(jsonb_build_object('day', series.day, 'students', case when per.n >= k then per.n end) order by series.day), '[]')
    into days from series left join per on per.day = series.day;

  -- reports are about questions, not students: the reporter is never shown
  select coalesce(jsonb_agg(jsonb_build_object('source', source, 'ref', ref, 'course', course, 'unit', unit, 'reports', n, 'open', o) order by n desc, last desc), '[]')
    into reports from (
      select source, ref, min(course) as course, min(unit) as unit, count(*) as n, count(*) filter (where status = 'open') as o, max(created_at) as last
      from question_reports where created_at >= since group by source, ref order by n desc, last desc limit 10
    ) r;

  with t as (
    select count(distinct s.user_id) as students, count(distinct s.id) as quizzes
    from quiz_sessions s where s.created_at >= since
  )
  select jsonb_build_object('students', case when students >= k then students end, 'quizzes', case when students >= k then quizzes end)
    into totals from t;

  return jsonb_build_object('days', d, 'k', k, 'since', since, 'units', units, 'daily', days, 'top_reported', reports, 'totals', totals);
end $$;
revoke all on function public.admin_analytics(integer) from public, anon, authenticated;
grant execute on function public.admin_analytics(integer) to service_role;
