-- lockin. class groups with real RBAC.
-- teachers      : who may create classes. Granted/revoked by an admin only (service role). A user can read only their own row.
-- classes       : owned by one teacher. invite_code is NOT readable by clients (column grant); the owner's page reads it server-side.
-- class_members : a student sees only their own row; the class owner sees the roster.
-- All writes go through service_role functions that the Next.js server calls after verifying the signed-in user.
-- Analytics functions return per-student data ONLY when the caller (p_owner) owns the class.

create table public.teachers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id) on delete set null
);
alter table public.teachers enable row level security;
create policy teachers_select_own on public.teachers for select to authenticated using (user_id = auth.uid());
revoke all on public.teachers from anon, authenticated;
grant select on public.teachers to authenticated;
grant all on public.teachers to service_role;

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  course text check (course is null or course ~ '^[A-Z]{2,3}-[0-9]{3}$'),
  invite_code text not null unique check (invite_code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index classes_owner on public.classes (owner_id, created_at desc);

create table public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);
create index class_members_user on public.class_members (user_id);

-- failed join-code attempts, for rate limiting (10 per hour per user)
create table public.class_join_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  at timestamptz not null default now()
);
create index class_join_attempts_user on public.class_join_attempts (user_id, at desc);

alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.class_join_attempts enable row level security;

-- security-definer helpers so the policies never recurse into each other
create function public.is_class_owner(p_class uuid) returns boolean
language sql stable security definer set search_path = public, pg_catalog as $$
  select exists (select 1 from classes where id = p_class and owner_id = auth.uid())
$$;
create function public.is_class_member(p_class uuid) returns boolean
language sql stable security definer set search_path = public, pg_catalog as $$
  select exists (select 1 from class_members where class_id = p_class and user_id = auth.uid())
$$;
revoke all on function public.is_class_owner(uuid), public.is_class_member(uuid) from public, anon;
grant execute on function public.is_class_owner(uuid), public.is_class_member(uuid) to authenticated, service_role;

create policy classes_select on public.classes for select to authenticated
  using (owner_id = auth.uid() or public.is_class_member(id));
create policy class_members_select on public.class_members for select to authenticated
  using (user_id = auth.uid() or public.is_class_owner(class_id));

revoke all on public.classes, public.class_members, public.class_join_attempts from anon, authenticated;
grant select (id, owner_id, name, course, archived, created_at) on public.classes to authenticated;
grant select on public.class_members to authenticated;
grant all on public.classes, public.class_members, public.class_join_attempts to service_role;

-- ------------------------------------------------------------------ internals
create function public.class_new_code() returns text
language plpgsql volatile set search_path = public, pg_catalog as $$
declare abc constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; b bytea; c text; i int; tries int := 0;
begin
  loop
    b := uuid_send(gen_random_uuid()); c := '';
    for i in 0..7 loop c := c || substr(abc, (get_byte(b, i) % 31) + 1, 1); end loop;
    exit when not exists (select 1 from classes where invite_code = c);
    tries := tries + 1;
    if tries > 20 then raise exception 'could not make a code'; end if;
  end loop;
  return c;
end $$;

create function public.class_clean_code(p_code text) returns text
language sql immutable set search_path = public, pg_catalog as $$
  select case when c ~ '^[A-HJ-NP-Z2-9]{8}$' then c else null end
  from (select upper(regexp_replace(left(coalesce(p_code, ''), 40), '[^A-Za-z0-9]', '', 'g')) as c) t
$$;

-- consecutive active days (XP earned) ending today or yesterday, in the student's own time zone
create function public.class_streak(p_user uuid, p_tz text) returns integer
language plpgsql stable set search_path = public, pg_catalog as $$
declare today date := (now() at time zone p_tz)::date; cur date; n int := 0;
begin
  cur := today;
  if not exists (select 1 from xp_events where user_id = p_user and (created_at at time zone p_tz)::date = today) then cur := today - 1; end if;
  while exists (select 1 from xp_events where user_id = p_user and (created_at at time zone p_tz)::date = cur) loop
    n := n + 1; cur := cur - 1;
  end loop;
  return n;
end $$;

revoke all on function public.class_new_code(), public.class_clean_code(text), public.class_streak(uuid, text) from public, anon, authenticated;
grant execute on function public.class_new_code(), public.class_clean_code(text), public.class_streak(uuid, text) to service_role;

-- ------------------------------------------------------------------ writes (service role only)
create function public.create_class(p_owner uuid, p_name text, p_course text) returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare nm text := btrim(coalesce(p_name, '')); cid uuid; code text; tries int := 0;
begin
  if not exists (select 1 from teachers where user_id = p_owner) then raise exception 'not a teacher'; end if;
  if char_length(nm) < 1 or char_length(nm) > 60 then raise exception 'bad name'; end if;
  if (select count(*) from classes where owner_id = p_owner and not archived) >= 30 then raise exception 'too many classes'; end if;
  loop
    code := class_new_code();
    begin
      insert into classes (owner_id, name, course, invite_code) values (p_owner, nm, p_course, code) returning id into cid;
      exit;
    exception when unique_violation then
      tries := tries + 1;
      if tries > 5 then raise exception 'could not make a code'; end if;
    end;
  end loop;
  return jsonb_build_object('id', cid, 'invite_code', code);
end $$;

-- status: ok | not_found | limited | full | own | already
create function public.join_class(p_user uuid, p_code text) returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare c text := class_clean_code(p_code); k classes%rowtype;
begin
  if not exists (select 1 from profiles where id = p_user) then raise exception 'unknown user'; end if;
  if (select count(*) from class_join_attempts where user_id = p_user and at > now() - interval '1 hour') >= 10 then
    return jsonb_build_object('status', 'limited');
  end if;
  if c is not null then select * into k from classes where invite_code = c and not archived; end if;
  if c is null or k.id is null then
    insert into class_join_attempts (user_id) values (p_user);
    delete from class_join_attempts where at < now() - interval '2 days';
    return jsonb_build_object('status', 'not_found');
  end if;
  if k.owner_id = p_user then return jsonb_build_object('status', 'own', 'id', k.id); end if;
  if exists (select 1 from class_members where class_id = k.id and user_id = p_user) then
    return jsonb_build_object('status', 'already', 'id', k.id);
  end if;
  if (select count(*) from class_members m join classes x on x.id = m.class_id where m.user_id = p_user and not x.archived) >= 5 then
    return jsonb_build_object('status', 'full');
  end if;
  if (select count(*) from class_members where class_id = k.id) >= 200 then
    return jsonb_build_object('status', 'not_found');
  end if;
  insert into class_members (class_id, user_id) values (k.id, p_user) on conflict do nothing;
  return jsonb_build_object('status', 'ok', 'id', k.id, 'name', k.name);
end $$;

create function public.leave_class(p_user uuid, p_class uuid) returns boolean
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  delete from class_members where class_id = p_class and user_id = p_user;
  return found;
end $$;

create function public.remove_class_member(p_owner uuid, p_class uuid, p_student uuid) returns boolean
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if not exists (select 1 from classes where id = p_class and owner_id = p_owner) then raise exception 'not your class'; end if;
  delete from class_members where class_id = p_class and user_id = p_student;
  return found;
end $$;

create function public.regenerate_class_code(p_owner uuid, p_class uuid) returns text
language plpgsql security definer set search_path = public, pg_catalog as $$
declare code text;
begin
  if not exists (select 1 from classes where id = p_class and owner_id = p_owner) then raise exception 'not your class'; end if;
  code := class_new_code();
  update classes set invite_code = code where id = p_class;
  return code;
end $$;

create function public.archive_class(p_owner uuid, p_class uuid, p_archived boolean) returns boolean
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  update classes set archived = p_archived where id = p_class and owner_id = p_owner;
  if not found then raise exception 'not your class'; end if;
  return true;
end $$;

-- ------------------------------------------------------------------ analytics (owner only)
-- Per-student numbers for members of a class that p_owner owns. Raises for anyone else.
create function public.class_roster_stats(p_owner uuid, p_class uuid) returns jsonb
language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare out jsonb := '[]'::jsonb; r record; x7 bigint; x30 bigint; q int; cor bigint; tot bigint; weak jsonb;
begin
  if not exists (select 1 from classes where id = p_class and owner_id = p_owner) then raise exception 'not your class'; end if;
  for r in
    select m.user_id, m.joined_at, p.name, p.timezone from class_members m join profiles p on p.id = m.user_id
    where m.class_id = p_class order by p.name, m.user_id
  loop
    select coalesce(sum(xp) filter (where created_at > now() - interval '7 days'), 0),
           coalesce(sum(xp) filter (where created_at > now() - interval '30 days'), 0)
      into x7, x30 from xp_events where user_id = r.user_id and created_at > now() - interval '30 days';
    select count(*), coalesce(sum(correct) filter (where kind <> 'mock'), 0), coalesce(sum(total) filter (where kind <> 'mock' and correct is not null), 0)
      into q, cor, tot from quiz_sessions where user_id = r.user_id and submitted_at is not null;
    select coalesce(jsonb_agg(jsonb_build_object('course', course, 'unit', unit, 'pct', pct, 'total', t) order by pct, t desc), '[]') into weak from (
      select course, unit, t, round(100.0 * c / t)::int as pct from (
        select course, unit, sum(correct) c, sum(total) t from quiz_sessions
        where user_id = r.user_id and submitted_at is not null and kind <> 'mock' and correct is not null group by course, unit) u
      where t > 0 and c < t order by round(100.0 * c / t), t desc limit 3) w;
    out := out || jsonb_build_object('user_id', r.user_id, 'name', r.name, 'joined_at', r.joined_at,
      'xp7', x7, 'xp30', x30, 'streak', class_streak(r.user_id, r.timezone), 'quizzes', q,
      'correct', cor, 'total', tot, 'accuracy', case when tot > 0 then round(100.0 * cor / tot)::int else null end, 'weakest', weak);
  end loop;
  return out;
end $$;

-- Class-level: summary numbers and the units where the class accuracy is lowest.
create function public.class_overview(p_owner uuid, p_class uuid) returns jsonb
language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare n int; active7 int; xp7 bigint; q7 int; cor bigint; tot bigint; weak jsonb;
begin
  if not exists (select 1 from classes where id = p_class and owner_id = p_owner) then raise exception 'not your class'; end if;
  select count(*) into n from class_members where class_id = p_class;
  select count(distinct e.user_id), coalesce(sum(e.xp), 0) into active7, xp7 from xp_events e
    join class_members m on m.user_id = e.user_id and m.class_id = p_class where e.created_at > now() - interval '7 days';
  select count(*) into q7 from quiz_sessions s join class_members m on m.user_id = s.user_id and m.class_id = p_class
    where s.submitted_at > now() - interval '7 days';
  select coalesce(sum(s.correct), 0), coalesce(sum(s.total), 0) into cor, tot from quiz_sessions s
    join class_members m on m.user_id = s.user_id and m.class_id = p_class
    where s.submitted_at is not null and s.kind <> 'mock' and s.correct is not null;
  select coalesce(jsonb_agg(jsonb_build_object('course', course, 'unit', unit, 'pct', pct, 'total', t, 'students', st) order by pct, t desc), '[]') into weak from (
    select course, unit, t, st, round(100.0 * c / t)::int as pct from (
      select s.course, s.unit, sum(s.correct) c, sum(s.total) t, count(distinct s.user_id) st from quiz_sessions s
      join class_members m on m.user_id = s.user_id and m.class_id = p_class
      where s.submitted_at is not null and s.kind <> 'mock' and s.correct is not null group by s.course, s.unit) u
    where t >= 3 order by round(100.0 * c / t), t desc limit 8) w;
  return jsonb_build_object('members', n, 'active7', active7, 'avg_xp7', case when n > 0 then round(xp7::numeric / n) else 0 end,
    'quizzes7', q7, 'accuracy', case when tot > 0 then round(100.0 * cor / tot)::int else null end, 'weak', weak);
end $$;

-- A student's own numbers next to the class average, for every class they are in. Aggregates only.
create function public.my_class_compare(p_user uuid) returns jsonb
language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare out jsonb := '[]'::jsonb; r record; n int; mine bigint; avg7 numeric; my_acc int; cl_acc int; c1 bigint; t1 bigint; c2 bigint; t2 bigint;
begin
  for r in select m.class_id from class_members m join classes k on k.id = m.class_id where m.user_id = p_user and not k.archived loop
    select count(*) into n from class_members where class_id = r.class_id;
    select coalesce(sum(xp), 0) into mine from xp_events where user_id = p_user and created_at > now() - interval '7 days';
    select coalesce(sum(e.xp), 0)::numeric / greatest(n, 1) into avg7 from xp_events e
      join class_members m on m.user_id = e.user_id and m.class_id = r.class_id where e.created_at > now() - interval '7 days';
    select coalesce(sum(correct), 0), coalesce(sum(total), 0) into c1, t1 from quiz_sessions
      where user_id = p_user and submitted_at is not null and kind <> 'mock' and correct is not null;
    select coalesce(sum(s.correct), 0), coalesce(sum(s.total), 0) into c2, t2 from quiz_sessions s
      join class_members m on m.user_id = s.user_id and m.class_id = r.class_id
      where s.submitted_at is not null and s.kind <> 'mock' and s.correct is not null;
    my_acc := case when t1 > 0 then round(100.0 * c1 / t1)::int end;
    cl_acc := case when t2 > 0 then round(100.0 * c2 / t2)::int end;
    out := out || jsonb_build_object('class_id', r.class_id, 'members', n, 'my_xp7', mine, 'avg_xp7', round(avg7),
      'my_accuracy', my_acc, 'avg_accuracy', cl_acc);
  end loop;
  return out;
end $$;

revoke all on function public.create_class(uuid, text, text), public.join_class(uuid, text), public.leave_class(uuid, uuid),
  public.remove_class_member(uuid, uuid, uuid), public.regenerate_class_code(uuid, uuid), public.archive_class(uuid, uuid, boolean),
  public.class_roster_stats(uuid, uuid), public.class_overview(uuid, uuid), public.my_class_compare(uuid) from public, anon, authenticated;
grant execute on function public.create_class(uuid, text, text), public.join_class(uuid, text), public.leave_class(uuid, uuid),
  public.remove_class_member(uuid, uuid, uuid), public.regenerate_class_code(uuid, uuid), public.archive_class(uuid, uuid, boolean),
  public.class_roster_stats(uuid, uuid), public.class_overview(uuid, uuid), public.my_class_compare(uuid) to service_role;
