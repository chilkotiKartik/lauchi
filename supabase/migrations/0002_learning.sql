-- lockin. learning: topic progress and server-scored quiz sessions.
-- Clients can only READ their own rows. Every write goes through service_role functions that the Next.js server
-- calls after it has verified the signed-in user and graded the answer itself.

grant execute on function public.award_xp(uuid, text, text, integer) to service_role;

create table public.topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_key text not null check (topic_key ~ '^[A-Z]{2,3}-[0-9]{3}:[0-9]{1,2}:[0-9]{1,3}$'),
  best_score smallint not null check (best_score between 0 and 100),
  completed_at timestamptz not null default now(),
  unique (user_id, topic_key)
);
create index topic_progress_user on public.topic_progress (user_id);
alter table public.topic_progress enable row level security;
create policy topic_progress_select_own on public.topic_progress for select to authenticated using (user_id = auth.uid());
revoke all on public.topic_progress from anon, authenticated;
grant select on public.topic_progress to authenticated;

create table public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course text not null check (course ~ '^[A-Z]{2,3}-[0-9]{3}$'),
  unit smallint not null check (unit between 1 and 12),
  seed integer not null,
  kind text not null check (kind in ('practice', 'topic')),
  topic_key text check (topic_key is null or topic_key ~ '^[A-Z]{2,3}-[0-9]{3}:[0-9]{1,2}:[0-9]{1,3}$'),
  total smallint not null check (total between 1 and 20),
  answers jsonb not null default '{}',
  correct smallint check (correct >= 0),
  xp smallint check (xp >= 0),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  check ((kind = 'topic') = (topic_key is not null))
);
create index quiz_sessions_user_time on public.quiz_sessions (user_id, created_at desc);
alter table public.quiz_sessions enable row level security;
create policy quiz_sessions_select_own on public.quiz_sessions for select to authenticated using (user_id = auth.uid());
revoke all on public.quiz_sessions from anon, authenticated;
-- the seed regenerates every question and answer, so it is never readable by the client
grant select (id, user_id, course, unit, kind, topic_key, total, correct, xp, created_at, submitted_at) on public.quiz_sessions to authenticated;

create function public.start_quiz_session(p_user uuid, p_course text, p_unit integer, p_seed integer, p_kind text, p_topic text, p_total integer)
returns uuid language plpgsql security definer set search_path = public, pg_catalog as $$
declare sid uuid;
begin
  if not exists (select 1 from profiles where id = p_user) then raise exception 'unknown user'; end if;
  if (select count(*) from quiz_sessions where user_id = p_user and created_at > now() - interval '24 hours') >= 120 then
    raise exception 'too many quizzes today';
  end if;
  insert into quiz_sessions (user_id, course, unit, seed, kind, topic_key, total)
    values (p_user, p_course, p_unit, p_seed, p_kind, p_topic, p_total) returning id into sid;
  return sid;
end $$;

-- The server has already graded the answer. The first answer for a question is final.
create function public.record_answer(p_user uuid, p_session uuid, p_index integer, p_answer jsonb, p_correct boolean)
returns boolean language plpgsql security definer set search_path = public, pg_catalog as $$
declare s quiz_sessions;
begin
  select * into s from quiz_sessions where id = p_session and user_id = p_user for update;
  if not found then raise exception 'unknown session'; end if;
  if s.submitted_at is not null then raise exception 'session already finished'; end if;
  if p_index < 0 or p_index >= s.total then raise exception 'bad question index'; end if;
  if s.answers ? p_index::text then return false; end if;
  update quiz_sessions set answers = answers || jsonb_build_object(p_index::text, jsonb_build_object('a', p_answer, 'ok', p_correct)) where id = p_session;
  return true;
end $$;

create function public.finish_quiz_session(p_user uuid, p_session uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_catalog as $$
declare s quiz_sessions; n_ok integer; pct integer; gained integer := 0; topic_new boolean := false; topic_xp integer := 0;
begin
  select * into s from quiz_sessions where id = p_session and user_id = p_user for update;
  if not found then raise exception 'unknown session'; end if;
  if s.submitted_at is not null then
    return jsonb_build_object('correct', s.correct, 'total', s.total, 'xp', 0, 'topic_completed', false, 'replay', true);
  end if;
  if (select count(*) from jsonb_object_keys(s.answers)) < s.total then raise exception 'answer every question first'; end if;
  if now() - s.created_at < make_interval(secs => s.total * 2) then raise exception 'finished too fast'; end if;
  select count(*) into n_ok from jsonb_each(s.answers) e where (e.value->>'ok')::boolean;
  pct := (n_ok * 100) / s.total;
  gained := award_xp(p_user, 'quiz_completed', s.id::text, n_ok * 3 + case when n_ok = s.total then 10 else 0 end);
  if s.kind = 'topic' then
    if pct >= 60 then
      insert into topic_progress (user_id, topic_key, best_score) values (p_user, s.topic_key, pct)
        on conflict (user_id, topic_key) do update set best_score = greatest(topic_progress.best_score, excluded.best_score);
      topic_new := not exists (select 1 from xp_events where user_id = p_user and kind = 'topic_completed' and ref = s.topic_key);
      if topic_new then topic_xp := award_xp(p_user, 'topic_completed', s.topic_key, 20); topic_new := topic_xp > 0; end if;
    end if;
  end if;
  update quiz_sessions set submitted_at = now(), correct = n_ok, xp = gained + topic_xp where id = s.id;
  return jsonb_build_object('correct', n_ok, 'total', s.total, 'xp', gained + topic_xp, 'topic_completed', topic_new, 'passed', pct >= 60, 'replay', false);
end $$;

revoke all on function public.start_quiz_session(uuid, text, integer, integer, text, text, integer) from public, anon, authenticated;
revoke all on function public.record_answer(uuid, uuid, integer, jsonb, boolean) from public, anon, authenticated;
revoke all on function public.finish_quiz_session(uuid, uuid) from public, anon, authenticated;
grant execute on function public.start_quiz_session(uuid, text, integer, integer, text, text, integer) to service_role;
grant execute on function public.record_answer(uuid, uuid, integer, jsonb, boolean) to service_role;
grant execute on function public.finish_quiz_session(uuid, uuid) to service_role;
