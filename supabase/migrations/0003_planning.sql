-- lockin. planning: the student's own exam date and study hours (used by the study plan and countdown).
alter table public.profiles
  add column exam_date date check (exam_date is null or exam_date between date '2024-01-01' and date '2100-01-01'),
  add column study_hours smallint not null default 2 check (study_hours between 1 and 12);

grant update (exam_date, study_hours) on public.profiles to authenticated;

-- ------------------------------------------------------------------ mock tests
-- A mock is a 20-question timed session spread across every unit of one subject. It pays under its own XP kind.
alter table public.quiz_sessions drop constraint quiz_sessions_kind_check;
alter table public.quiz_sessions add constraint quiz_sessions_kind_check check (kind in ('practice', 'topic', 'mock'));

create or replace function public.finish_quiz_session(p_user uuid, p_session uuid)
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
  gained := award_xp(p_user, case when s.kind = 'mock' then 'mock_completed' else 'quiz_completed' end, s.id::text,
                     n_ok * 3 + case when n_ok = s.total then 10 else 0 end);
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
