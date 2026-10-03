-- Lab progress: a student's best result in each 3D lab, from the in-lab tasks (predict → test → explain) or the guided
-- experiment. One row per (student, lab, kind). XP is paid once per lab and kind, through award_xp (which also applies
-- the global daily cap), so replaying a lab never pays twice. Written only by the server (service role).

create table public.lab_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lab text not null check (lab ~ '^[a-z0-9]{2,24}$'),
  kind text not null check (kind in ('tasks', 'experiment')),
  best smallint not null check (best between 0 and 100),
  attempts integer not null default 1 check (attempts >= 1),
  first_done timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, lab, kind)
);
alter table public.lab_progress enable row level security;
create policy lab_progress_select_own on public.lab_progress for select to authenticated using (user_id = (select auth.uid()));
grant select on public.lab_progress to authenticated;

-- 5 XP for finishing a lab's tasks plus up to 10 for the score; experiments pay 10 plus up to 15.
create function public.record_lab(p_user uuid, p_lab text, p_kind text, p_score integer)
returns jsonb language plpgsql security definer set search_path = public, pg_catalog as $$
declare s smallint := greatest(0, least(100, p_score)); paid integer := 0; first boolean;
begin
  if p_lab !~ '^[a-z0-9]{2,24}$' or p_kind not in ('tasks', 'experiment') then raise exception 'bad lab result'; end if;
  insert into lab_progress (user_id, lab, kind, best) values (p_user, p_lab, p_kind, s)
    on conflict (user_id, lab, kind) do update
      set best = greatest(lab_progress.best, excluded.best), attempts = lab_progress.attempts + 1, updated_at = now()
    returning (xmax = 0) into first;
  if first then
    paid := award_xp(p_user, 'quiz_completed', 'lab:' || p_kind || ':' || p_lab,
      case when p_kind = 'tasks' then 5 + s / 10 else 10 + (s * 15) / 100 end);
  end if;
  return jsonb_build_object('xp', paid, 'first', first);
end $$;
revoke all on function public.record_lab(uuid, text, text, integer) from public, anon, authenticated;
grant execute on function public.record_lab(uuid, text, text, integer) to service_role;
