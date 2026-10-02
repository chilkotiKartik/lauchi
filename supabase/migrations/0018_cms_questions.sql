-- lockin. Question bank CMS: admin-authored questions that students practise at /bank.
-- Students may read only PUBLISHED rows and only the columns that are safe before answering: the answer, explanation and
-- steps are never granted to clients, so they reach the browser only after the server has graded an answer.
-- Admin writes go through server actions using service_role (after requireAdmin()).

create table public.cms_questions (
  id uuid primary key default gen_random_uuid(),
  course text not null check (course ~ '^[A-Z]{2,3}-[0-9]{3}$'),
  unit smallint not null check (unit between 1 and 12),
  kind text not null check (kind in ('mcq', 'multi', 'numeric', 'tf')),
  stem text not null check (char_length(btrim(stem)) between 3 and 2000),
  options jsonb not null default '[]' check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) <= 6),
  answer jsonb not null,
  explanation text not null default '' check (char_length(explanation) <= 3000),
  steps jsonb check (steps is null or (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) <= 12)),
  difficulty smallint not null default 2 check (difficulty between 1 and 3),
  tags text[] not null default '{}' check (cardinality(tags) <= 8),
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create index cms_questions_lookup on public.cms_questions (course, unit, status);
alter table public.cms_questions enable row level security;
create policy cms_questions_select_published on public.cms_questions for select to authenticated using (status = 'published');
revoke all on public.cms_questions from anon, authenticated;
grant select (id, course, unit, kind, stem, options, difficulty, tags, status, created_at, updated_at, published_at) on public.cms_questions to authenticated;

-- One row per student per question per India day (latest result wins). Students can read only their own rows.
create table public.cms_question_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.cms_questions(id) on delete cascade,
  day date not null,
  correct boolean not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id, day)
);
create index cms_question_attempts_user on public.cms_question_attempts (user_id, updated_at);
alter table public.cms_question_attempts enable row level security;
create policy cms_attempts_select_own on public.cms_question_attempts for select to authenticated using (user_id = auth.uid());
revoke all on public.cms_question_attempts from anon, authenticated;
grant select on public.cms_question_attempts to authenticated;

-- Record a graded answer and pay XP once per question per day (3 XP right, 1 XP wrong), at most 40 paid answers a day,
-- through award_xp (which also applies the global daily cap). Called by the server after it graded the answer.
create function public.cms_record_attempt(p_user uuid, p_question uuid, p_correct boolean)
returns jsonb language plpgsql security definer set search_path = public, pg_catalog as $$
declare today date := (now() at time zone 'Asia/Kolkata')::date; n_today integer; paid integer := 0;
begin
  if not exists (select 1 from cms_questions where id = p_question and status = 'published') then raise exception 'unknown question'; end if;
  insert into cms_question_attempts (user_id, question_id, day, correct) values (p_user, p_question, today, p_correct)
    on conflict (user_id, question_id, day) do update set correct = excluded.correct, updated_at = now();
  select count(*) into n_today from xp_events
    where user_id = p_user and kind = 'quiz_completed' and ref like 'cms:%' and (created_at at time zone 'Asia/Kolkata')::date = today;
  if n_today < 40 then
    paid := award_xp(p_user, 'quiz_completed', 'cms:' || p_question::text || ':' || today::text, case when p_correct then 3 else 1 end);
  end if;
  return jsonb_build_object('xp', paid);
end $$;
revoke all on function public.cms_record_attempt(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.cms_record_attempt(uuid, uuid, boolean) to service_role;
