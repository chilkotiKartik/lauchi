-- lockin. full 3-hour paper simulator (UTU-style end-semester paper) and a daily cap for photo checking of answers.
-- Every write to papers comes from the Next.js server acting as the signed-in student (RLS: own rows only). The paper
-- itself (which PYQs) is fixed at the start and stored, so an attempt always shows the same paper.

-- ------------------------------------------------------------------ papers
create table public.papers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course text not null check (course ~ '^[A-Z]{2,3}-[0-9]{3}$'),
  seed integer not null check (seed > 0),
  mode text not null default 'practice' check (mode in ('practice', 'exam')),
  -- the generated paper: 5 questions × 3 PYQ ids, e.g. [["Q1.2","Q1.5","Q1.1"], ...]
  paper jsonb not null check (jsonb_typeof(paper) = 'array' and octet_length(paper::text) <= 4000),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  paused_at timestamptz,
  submitted_at timestamptz,
  -- parts the student marked as attempted, e.g. ["1a","1c","2b"]
  chosen jsonb not null default '[]' check (jsonb_typeof(chosen) = 'array' and octet_length(chosen::text) <= 2000),
  -- self-marking: part key -> { "t": [ticked rubric indexes] }
  self_marks jsonb not null default '{}' check (jsonb_typeof(self_marks) = 'object' and octet_length(self_marks::text) <= 20000),
  notes text not null default '' check (char_length(notes) <= 20000),
  total numeric(5, 1) check (total is null or (total >= 0 and total <= 100)),
  created_at timestamptz not null default now(),
  check (ends_at > started_at and ends_at <= started_at + interval '30 days')
);
create index papers_user_created on public.papers (user_id, created_at desc);
alter table public.papers enable row level security;
create policy papers_select_own on public.papers for select to authenticated using (user_id = auth.uid());
create policy papers_insert_own on public.papers for insert to authenticated with check (user_id = auth.uid());
create policy papers_update_own on public.papers for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy papers_delete_own on public.papers for delete to authenticated using (user_id = auth.uid());
revoke all on public.papers from anon, authenticated;
grant select, delete on public.papers to authenticated;
grant insert (user_id, course, seed, mode, paper, started_at, ends_at) on public.papers to authenticated;
grant update (ends_at, paused_at, submitted_at, chosen, self_marks, notes, total) on public.papers to authenticated;

-- At most 40 new papers a day per student (a paper is 3 hours; this only stops scripted floods).
create function public.papers_limit() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if (select count(*) from papers where user_id = new.user_id and created_at > now() - interval '1 day') >= 40 then
    raise exception 'too many papers today';
  end if;
  return new;
end $$;
revoke all on function public.papers_limit() from public, anon, authenticated;
create trigger papers_limit before insert on public.papers for each row execute function public.papers_limit();

-- ------------------------------------------------------------------ photo check usage cap
-- Separate from Ask Lochi's ai_usage so checking answers never eats the question allowance (and vice versa).
create table public.check_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default ((now() at time zone 'Asia/Kolkata')::date),
  n integer not null default 0 check (n >= 0),
  primary key (user_id, day)
);
alter table public.check_usage enable row level security;
revoke all on public.check_usage from anon, authenticated;

-- Counts one photo check. Returns false (and counts nothing) once the student has used today's allowance.
create function public.bump_check_usage(p_user uuid, p_limit integer) returns boolean
language plpgsql security definer set search_path = public, pg_catalog as $$
declare used integer;
begin
  insert into check_usage (user_id, day, n) values (p_user, (now() at time zone 'Asia/Kolkata')::date, 1)
    on conflict (user_id, day) do update set n = check_usage.n + 1 where check_usage.n < p_limit
    returning n into used;
  return used is not null;
end $$;
revoke all on function public.bump_check_usage(uuid, integer) from public, anon, authenticated;
grant execute on function public.bump_check_usage(uuid, integer) to service_role;
