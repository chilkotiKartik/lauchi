-- lockin. "Revise today" spaced repetition, adaptive practice picks and per-template answer stats.
-- As with quizzes, clients can only READ their own rows; every write goes through service_role functions that the
-- Next.js server calls after it has verified the signed-in user (and graded the answer itself).

-- ------------------------------------------------------------------ revise queue
create table public.revise_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('quiz', 'pyq')),
  -- quiz: COURSE:unit:template:seed (rebuilds the exact question); pyq: COURSE:pyq id
  ref text not null check (char_length(ref) between 3 and 80),
  course text not null check (course ~ '^[A-Z]{2,3}-[0-9]{3}$'),
  unit smallint not null check (unit between 1 and 12),
  title text not null check (char_length(title) between 1 and 200),
  step smallint not null default 0 check (step between 0 and 4),
  due date not null,
  last_reviewed timestamptz,
  lapses integer not null default 0 check (lapses >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref)
);
create index revise_items_user_due on public.revise_items (user_id, due);
alter table public.revise_items enable row level security;
create policy revise_items_select_own on public.revise_items for select to authenticated using (user_id = auth.uid());
revoke all on public.revise_items from anon, authenticated;
-- the ref of a quiz item carries a question seed, so it stays server-side
grant select (id, user_id, kind, course, unit, title, step, due, last_reviewed, lapses, created_at) on public.revise_items to authenticated;

-- Today in India (the queue runs on India days).
create function public.revise_today() returns date language sql stable set search_path = public, pg_catalog as $$
  select (now() at time zone 'Asia/Kolkata')::date
$$;
revoke all on function public.revise_today() from public, anon;
grant execute on function public.revise_today() to authenticated, service_role;

-- Add an item, due tomorrow. An item already in the queue is left as it is. At most 3000 items per student.
create function public.revise_add(p_user uuid, p_kind text, p_ref text, p_course text, p_unit integer, p_title text)
returns boolean language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if not exists (select 1 from profiles where id = p_user) then raise exception 'unknown user'; end if;
  if (select count(*) from revise_items where user_id = p_user) >= 3000 then return false; end if;
  insert into revise_items (user_id, kind, ref, course, unit, title, due)
    values (p_user, p_kind, p_ref, p_course, p_unit, left(btrim(p_title), 200), revise_today() + 1)
    on conflict (user_id, kind, ref) do nothing;
  return found;
end $$;

create function public.revise_remove(p_user uuid, p_kind text, p_ref text)
returns boolean language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  delete from revise_items where user_id = p_user and kind = p_kind and ref = p_ref;
  return found;
end $$;

-- Grade one due review. Right: one step up the ladder 1 → 3 → 7 → 21 → 60 days (60 repeats). Wrong: back to step 0,
-- due tomorrow. Only an item that is due can be reviewed (so it can't be farmed), and each review pays 2 XP, at most
-- 25 paid reviews a day, through award_xp (which also applies the global daily cap).
create function public.revise_review(p_user uuid, p_id uuid, p_ok boolean)
returns jsonb language plpgsql security definer set search_path = public, pg_catalog as $$
declare r revise_items; today date := revise_today(); gaps integer[] := array[1, 3, 7, 21, 60]; nstep integer; ndue date; paid integer := 0; n_today integer;
begin
  select * into r from revise_items where id = p_id and user_id = p_user for update;
  if not found then raise exception 'unknown item'; end if;
  if r.due > today then
    return jsonb_build_object('reviewed', false, 'step', r.step, 'due', r.due, 'xp', 0);
  end if;
  if p_ok then nstep := least(r.step + 1, 4); else nstep := 0; end if;
  ndue := today + gaps[nstep + 1];
  update revise_items set step = nstep, due = ndue, last_reviewed = now(), lapses = lapses + case when p_ok then 0 else 1 end where id = r.id;
  select count(*) into n_today from xp_events
    where user_id = p_user and kind = 'quiz_completed' and ref like 'revise:%' and (created_at at time zone 'Asia/Kolkata')::date = today;
  if n_today < 25 then paid := award_xp(p_user, 'quiz_completed', 'revise:' || r.id::text || ':' || today::text, 2); end if;
  return jsonb_build_object('reviewed', true, 'step', nstep, 'due', ndue, 'xp', paid);
end $$;

revoke all on function public.revise_add(uuid, text, text, text, integer, text) from public, anon, authenticated;
revoke all on function public.revise_remove(uuid, text, text) from public, anon, authenticated;
revoke all on function public.revise_review(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.revise_add(uuid, text, text, text, integer, text) to service_role;
grant execute on function public.revise_remove(uuid, text, text) to service_role;
grant execute on function public.revise_review(uuid, uuid, boolean) to service_role;

-- ------------------------------------------------------------------ adaptive practice
-- picks: question index -> template index, chosen for a practice session one question ahead and stored so a reload
-- shows the same question. Never readable by clients (the column grant on quiz_sessions is an explicit list).
alter table public.quiz_sessions add column picks jsonb not null default '{}';
create index quiz_sessions_course_unit on public.quiz_sessions (course, unit);

-- First pick wins, so two tabs can't disagree. Returns the stored template.
create function public.set_quiz_pick(p_user uuid, p_session uuid, p_index integer, p_template integer)
returns integer language plpgsql security definer set search_path = public, pg_catalog as $$
declare s quiz_sessions;
begin
  select * into s from quiz_sessions where id = p_session and user_id = p_user for update;
  if not found then raise exception 'unknown session'; end if;
  if s.kind <> 'practice' then raise exception 'not a practice session'; end if;
  if p_index < 1 or p_index >= s.total then raise exception 'bad question index'; end if;
  if p_template < 0 or p_template > 999 then raise exception 'bad template'; end if;
  if s.picks ? p_index::text then return (s.picks ->> p_index::text)::integer; end if;
  if s.submitted_at is not null or s.answers ? p_index::text then raise exception 'question already answered'; end if;
  update quiz_sessions set picks = picks || jsonb_build_object(p_index::text, p_template) where id = s.id;
  return p_template;
end $$;

-- Like record_answer, but also tags the answer with the template, effective seed and unit of the question, so the
-- question can always be rebuilt and every template's success rate can be measured.
create function public.record_answer_tagged(p_user uuid, p_session uuid, p_index integer, p_answer jsonb, p_correct boolean,
  p_template integer, p_seed integer, p_unit integer)
returns boolean language plpgsql security definer set search_path = public, pg_catalog as $$
declare s quiz_sessions;
begin
  select * into s from quiz_sessions where id = p_session and user_id = p_user for update;
  if not found then raise exception 'unknown session'; end if;
  if s.submitted_at is not null then raise exception 'session already finished'; end if;
  if p_index < 0 or p_index >= s.total then raise exception 'bad question index'; end if;
  if s.answers ? p_index::text then return false; end if;
  update quiz_sessions set answers = answers || jsonb_build_object(p_index::text,
    jsonb_build_object('a', p_answer, 'ok', p_correct, 't', p_template, 's', p_seed, 'u', p_unit)) where id = p_session;
  return true;
end $$;

-- Per-template success across ALL students for one unit (aggregates only; no user data leaves).
create function public.quiz_template_stats(p_course text, p_unit integer)
returns table (template integer, attempts bigint, correct bigint)
language sql stable security definer set search_path = public, pg_catalog as $$
  select (e.value ->> 't')::integer, count(*), count(*) filter (where (e.value ->> 'ok')::boolean)
  from quiz_sessions s cross join lateral jsonb_each(s.answers) e
  where s.course = p_course and (s.unit = p_unit or s.kind = 'mock')
    and jsonb_typeof(e.value) = 'object' and e.value ? 't' and e.value -> 'a' <> 'null'::jsonb
    and coalesce((e.value ->> 'u')::integer, s.unit) = p_unit
  group by 1
$$;

revoke all on function public.set_quiz_pick(uuid, uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.record_answer_tagged(uuid, uuid, integer, jsonb, boolean, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.quiz_template_stats(text, integer) from public, anon, authenticated;
grant execute on function public.set_quiz_pick(uuid, uuid, integer, integer) to service_role;
grant execute on function public.record_answer_tagged(uuid, uuid, integer, jsonb, boolean, integer, integer, integer) to service_role;
grant execute on function public.quiz_template_stats(text, integer) to service_role;
