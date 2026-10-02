-- lockin. saved lab setups and practice assignments.

-- ------------------------------------------------------------------ saved lab setups
-- A student's own named slider values for a lab. Values are re-validated and clamped by the lab on load.
create table public.lab_setups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lab text not null check (lab ~ '^[a-z0-9]{2,24}$'),
  name text not null check (char_length(btrim(name)) between 1 and 40),
  params jsonb not null check (jsonb_typeof(params) = 'object' and pg_column_size(params) <= 1500),
  created_at timestamptz not null default now()
);
create index lab_setups_user_lab on public.lab_setups (user_id, lab, created_at desc);
alter table public.lab_setups enable row level security;
create policy lab_setups_select_own on public.lab_setups for select to authenticated using (user_id = auth.uid());
create policy lab_setups_insert_own on public.lab_setups for insert to authenticated with check (user_id = auth.uid());
create policy lab_setups_delete_own on public.lab_setups for delete to authenticated using (user_id = auth.uid());
revoke all on public.lab_setups from anon, authenticated;
grant select, delete on public.lab_setups to authenticated;
grant insert (lab, name, params) on public.lab_setups to authenticated;

-- At most 100 saved setups per student, so the table cannot be used as free storage.
create function public.limit_lab_setups() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  new.name := btrim(new.name);
  if (select count(*) from lab_setups where user_id = new.user_id) >= 100 then
    raise exception 'too many saved setups';
  end if;
  return new;
end $$;
create trigger lab_setups_limit before insert on public.lab_setups for each row execute function public.limit_lab_setups();

-- ------------------------------------------------------------------ practice assignments
-- An assignment is a 10-question, untimed, resumable set for one unit. No verdicts until it is submitted.
-- It pays once per unit, ever (ref = course:unit), so retaking it never farms XP.
alter table public.quiz_sessions drop constraint quiz_sessions_kind_check;
alter table public.quiz_sessions add constraint quiz_sessions_kind_check check (kind in ('practice', 'topic', 'mock', 'assignment'));
alter table public.xp_events drop constraint xp_events_kind_check;
alter table public.xp_events add constraint xp_events_kind_check
  check (kind in ('topic_completed','quiz_completed','practical_completed','mock_completed','assignment_completed','daily_goal_completed'));

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
  if s.kind = 'assignment' then
    gained := case when pct >= 40 then award_xp(p_user, 'assignment_completed', s.course || ':' || s.unit, n_ok * 4 + case when n_ok = s.total then 10 else 0 end) else 0 end;
  else
    gained := award_xp(p_user, case when s.kind = 'mock' then 'mock_completed' else 'quiz_completed' end, s.id::text,
                       n_ok * 3 + case when n_ok = s.total then 10 else 0 end);
  end if;
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
revoke all on function public.finish_quiz_session(uuid, uuid) from public, anon, authenticated;
grant execute on function public.finish_quiz_session(uuid, uuid) to service_role;
