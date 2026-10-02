-- lockin. doubt box + exam preparation.
-- Doubts are private to the asker. A doubt reaches the shared library only when the asker agreed (visibility = 'public'),
-- it has an answer, and an admin/teacher published it. The library is read ONLY through public_doubts(), which never returns the asker.

create table public.doubts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course text not null check (course ~ '^[A-Z]{2,3}-[0-9]{3}$'),
  unit smallint check (unit is null or unit between 1 and 12),
  title text not null check (char_length(title) between 5 and 140),
  body text not null check (char_length(body) between 10 and 2000),
  status text not null default 'open' check (status in ('open', 'answered', 'resolved')),
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  class_id uuid, -- set once classes exist; deliberately no foreign key
  published boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  check (not published or visibility = 'public')
);
create index doubts_user on public.doubts (user_id, created_at desc);
create index doubts_status on public.doubts (status, created_at desc);
alter table public.doubts enable row level security;
create policy doubts_select_own on public.doubts for select to authenticated using (user_id = auth.uid() and not hidden);
create policy doubts_insert_own on public.doubts for insert to authenticated
  with check (user_id = auth.uid() and status = 'open' and published = false and hidden = false);
revoke all on public.doubts from anon, authenticated;
grant select on public.doubts to authenticated;
grant insert (id, user_id, course, unit, title, body, visibility) on public.doubts to authenticated;
grant all on public.doubts to service_role;

create table public.doubt_answers (
  id uuid primary key default gen_random_uuid(),
  doubt_id uuid not null references public.doubts(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_kind text not null check (author_kind in ('teacher', 'ai', 'admin')),
  body text not null check (char_length(body) between 1 and 6000),
  helpful_count integer not null default 0 check (helpful_count >= 0),
  created_at timestamptz not null default now()
);
create index doubt_answers_doubt on public.doubt_answers (doubt_id, created_at);
alter table public.doubt_answers enable row level security;
create policy doubt_answers_select_own on public.doubt_answers for select to authenticated
  using (exists (select 1 from public.doubts d where d.id = doubt_id and d.user_id = auth.uid() and not d.hidden));
revoke all on public.doubt_answers from anon, authenticated;
grant select on public.doubt_answers to authenticated;
grant all on public.doubt_answers to service_role;

create table public.doubt_helpful (
  answer_id uuid not null references public.doubt_answers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (answer_id, user_id)
);
alter table public.doubt_helpful enable row level security;
create policy doubt_helpful_select_own on public.doubt_helpful for select to authenticated using (user_id = auth.uid());
revoke all on public.doubt_helpful from anon, authenticated;
grant select on public.doubt_helpful to authenticated;
grant all on public.doubt_helpful to service_role;

-- A vote counts once per student, only on answers they can see (their own doubt, or a published one). Returns the new count, or null when not allowed.
create function public.doubt_mark_helpful(p_answer uuid) returns integer
language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); n integer; ok boolean;
begin
  if uid is null then return null; end if;
  select exists (select 1 from doubt_answers a join doubts d on d.id = a.doubt_id
    where a.id = p_answer and not d.hidden and (d.user_id = uid or (d.published and d.visibility = 'public'))) into ok;
  if not ok then return null; end if;
  insert into doubt_helpful (answer_id, user_id) values (p_answer, uid) on conflict do nothing;
  if found then update doubt_answers set helpful_count = helpful_count + 1 where id = p_answer; end if;
  select helpful_count into n from doubt_answers where id = p_answer;
  return n;
end $$;
revoke all on function public.doubt_mark_helpful(uuid) from public, anon;
grant execute on function public.doubt_mark_helpful(uuid) to authenticated, service_role;

-- The shared library: published, public, answered doubts. No user id, name or email. Optional text search over title and body.
create function public.public_doubts(p_q text default null) returns table (id uuid, course text, unit smallint, title text, body text, created_at timestamptz, answers jsonb)
language sql stable security definer set search_path = public, pg_catalog as $$
  select d.id, d.course, d.unit, d.title, d.body, d.created_at,
    (select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'kind', a.author_kind, 'body', a.body, 'helpful', a.helpful_count) order by a.helpful_count desc, a.created_at), '[]'::jsonb)
       from doubt_answers a where a.doubt_id = d.id) as answers
  from doubts d
  where auth.uid() is not null and d.published and d.visibility = 'public' and not d.hidden and d.status in ('answered', 'resolved')
    and exists (select 1 from doubt_answers a where a.doubt_id = d.id)
    and (p_q is null or p_q = '' or d.title ilike '%' || replace(replace(replace(left(p_q, 80), '\', '\\'), '%', '\%'), '_', '\_') || '%'
         or d.body ilike '%' || replace(replace(replace(left(p_q, 80), '\', '\\'), '%', '\%'), '_', '\_') || '%')
  order by d.created_at desc
  limit 300
$$;
revoke all on function public.public_doubts(text) from public, anon;
grant execute on function public.public_doubts(text) to authenticated, service_role;

-- ------------------------------------------------------------------ exam preparation
create table public.exam_plan_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  course text not null check (course ~ '^[A-Z]{2,3}-[0-9]{3}$'),
  unit smallint not null check (unit between 1 and 12),
  primary key (user_id, course, unit)
);
alter table public.exam_plan_items enable row level security;
create policy exam_plan_items_own on public.exam_plan_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.exam_plan_items from anon, authenticated;
grant select, insert, delete on public.exam_plan_items to authenticated;
grant all on public.exam_plan_items to service_role;

create table public.exam_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  course text not null check (course ~ '^[A-Z]{2,3}-[0-9]{3}$'),
  unit smallint not null check (unit between 0 and 12),
  kind text not null check (kind in ('learn', 'practice', 'pyq', 'revise', 'mock')),
  minutes smallint not null default 30 check (minutes between 5 and 480),
  done boolean not null default false,
  done_at timestamptz,
  unique (user_id, day, course, unit, kind)
);
create index exam_tasks_user_day on public.exam_tasks (user_id, day);
alter table public.exam_tasks enable row level security;
create policy exam_tasks_own on public.exam_tasks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.exam_tasks from anon, authenticated;
grant select, insert, delete on public.exam_tasks to authenticated;
grant update (done, done_at) on public.exam_tasks to authenticated;
grant all on public.exam_tasks to service_role;
