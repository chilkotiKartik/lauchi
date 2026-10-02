-- lockin. admin CMS: lessons and lab questions. Admin writes go through server actions (service role) after requireAdmin().
-- Students can read PUBLISHED rows only (RLS). Drafts are invisible to them.

create table public.cms_lessons (
  id uuid primary key default gen_random_uuid(),
  course text not null check (course ~ '^[A-Z]{2,3}-[0-9]{3}$'),
  unit smallint not null check (unit between 1 and 12),
  topic smallint not null check (topic between 1 and 200),
  title text not null default '' check (char_length(title) <= 200),
  body jsonb not null check (jsonb_typeof(body) = 'object'),
  status text not null default 'draft' check (status in ('draft', 'published')),
  version integer not null default 1,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index cms_lessons_one_published on public.cms_lessons (course, unit, topic) where status = 'published';
create index cms_lessons_lookup on public.cms_lessons (course, unit, topic);
alter table public.cms_lessons enable row level security;
create policy cms_lessons_select_published on public.cms_lessons for select to authenticated using (status = 'published');
revoke all on public.cms_lessons from anon, authenticated;
grant select on public.cms_lessons to authenticated;
grant all on public.cms_lessons to service_role;

create table public.cms_lab_questions (
  id uuid primary key default gen_random_uuid(),
  lab_id text not null check (lab_id ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  kind text not null check (kind in ('mcq', 'tf', 'numeric')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  status text not null default 'draft' check (status in ('draft', 'published')),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cms_lab_questions_lab on public.cms_lab_questions (lab_id, status);
alter table public.cms_lab_questions enable row level security;
create policy cms_lab_questions_select_published on public.cms_lab_questions for select to authenticated using (status = 'published');
revoke all on public.cms_lab_questions from anon, authenticated;
grant select on public.cms_lab_questions to authenticated;
grant all on public.cms_lab_questions to service_role;

-- Admin dashboard numbers in one call (service role only). Dates are India time.
create function public.admin_stats() returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  tz text := 'Asia/Kolkata';
  today date := (now() at time zone tz)::date;
  r jsonb;
begin
  with act as (
    select user_id, (created_at at time zone tz)::date as d from public.xp_events where created_at > now() - interval '8 days'
    union
    select user_id, (created_at at time zone tz)::date from public.quiz_sessions where created_at > now() - interval '8 days'
  )
  select jsonb_build_object(
    'students', (select count(*) from public.profiles where onboarded_at is not null),
    'by_branch', coalesce((select jsonb_object_agg(coalesce(branch, 'unknown'), n) from (select branch, count(*) n from public.profiles where onboarded_at is not null group by branch) b), '{}'::jsonb),
    'dau', (select count(distinct user_id) from act where d = today),
    'wau', (select count(distinct user_id) from act where d > today - 7),
    'quizzes_per_day', coalesce((select jsonb_object_agg(d, n) from (select (created_at at time zone tz)::date d, count(*) n from public.quiz_sessions where created_at > now() - interval '15 days' group by 1) q), '{}'::jsonb),
    'open_reports', (select count(*) from public.question_reports where status = 'open'),
    'resources', (select count(*) from public.resources where not hidden),
    'lessons_published', (select count(*) from public.cms_lessons where status = 'published'),
    'lab_questions_published', (select count(*) from public.cms_lab_questions where status = 'published'),
    'today', today
  ) into r;
  return r;
end $$;
revoke all on function public.admin_stats() from public, anon, authenticated;
grant execute on function public.admin_stats() to service_role;

-- service_role (the Next.js server) must be able to use every table above; students keep only the grants set per table.
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;
