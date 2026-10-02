-- lockin. friends, study groups, group streaks and nudges.
-- Privacy: clients never touch these tables directly. Every read and write goes through the SECURITY DEFINER functions
-- below, which only ever return first names (never emails, last names, branches or user ids) and only for people who
-- are actually the caller's friends or in one of the caller's groups. Day boundaries use India time (Asia/Kolkata).

-- ------------------------------------------------------------------ tables
create table public.friend_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  created_at timestamptz not null default now()
);

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null references auth.users(id) on delete cascade,
  addressee uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  check (requester <> addressee)
);
create unique index friendships_pair on public.friendships (least(requester, addressee), greatest(requester, addressee));
create index friendships_addressee on public.friendships (addressee);

create table public.study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 40),
  emoji text not null default '📚' check (char_length(emoji) between 1 and 8),
  color text not null default 'green' check (color in ('green', 'blue', 'gold', 'orange', 'purple', 'red')),
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  owner_id uuid references auth.users(id) on delete set null,
  goal_xp integer not null default 500 check (goal_xp between 50 and 20000),
  created_at timestamptz not null default now()
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(), -- opaque handle shown to other members instead of the user id
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);
create index group_members_user on public.group_members (user_id);

create table public.nudges (
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  day date not null default ((now() at time zone 'Asia/Kolkata')::date),
  created_at timestamptz not null default now(),
  primary key (from_user, to_user, day),
  check (from_user <> to_user)
);
create index nudges_to_day on public.nudges (to_user, day);

-- Wrong codes typed per student per day (slows down anyone guessing invite codes).
create table public.social_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default ((now() at time zone 'Asia/Kolkata')::date),
  n integer not null default 0 check (n >= 0),
  primary key (user_id, day)
);

alter table public.friend_codes enable row level security;
alter table public.friendships enable row level security;
alter table public.study_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.nudges enable row level security;
alter table public.social_attempts enable row level security;
revoke all on public.friend_codes, public.friendships, public.study_groups, public.group_members, public.nudges, public.social_attempts
  from public, anon, authenticated;

-- ------------------------------------------------------------------ internal helpers (not callable by clients)
create function public.social_first_name(p_name text) returns text
language sql immutable set search_path = public, pg_catalog as $$
  select coalesce(nullif(left(split_part(btrim(coalesce(p_name, '')), ' ', 1), 14), ''), 'Student');
$$;

create function public.social_today() returns date
language sql stable set search_path = public, pg_catalog as $$ select (now() at time zone 'Asia/Kolkata')::date $$;

-- 8 characters from an alphabet without look-alikes (no I, L, O, 0, 1), unique across friend and group codes.
create function public.social_new_code() returns text
language plpgsql volatile set search_path = public, pg_catalog as $$
declare abc constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; b bytea; c text; i int;
begin
  loop
    b := uuid_send(gen_random_uuid()); c := '';
    for i in 0..7 loop c := c || substr(abc, 1 + (get_byte(b, i) % 31), 1); end loop;
    exit when not exists (select 1 from friend_codes where code = c) and not exists (select 1 from study_groups where code = c);
  end loop;
  return c;
end $$;

-- Uppercases, drops spaces/dashes. Returns null when it cannot be a valid code.
create function public.social_clean_code(p_code text) returns text
language sql immutable set search_path = public, pg_catalog as $$
  select case when c ~ '^[A-HJ-NP-Z2-9]{8}$' then c end
  from (select upper(regexp_replace(left(coalesce(p_code, ''), 40), '[^A-Za-z0-9]', '', 'g')) as c) t;
$$;

-- Counts a wrong code. Returns true once the student has typed too many wrong codes today.
create function public.social_limited(p_user uuid, p_bump boolean) returns boolean
language plpgsql volatile set search_path = public, pg_catalog as $$
declare used int;
begin
  if p_bump then
    insert into social_attempts (user_id, day, n) values (p_user, social_today(), 1)
      on conflict (user_id, day) do update set n = social_attempts.n + 1;
  end if;
  select n into used from social_attempts where user_id = p_user and day = social_today();
  return coalesce(used, 0) >= 20;
end $$;

-- Active days (sum of XP > 0) in a timezone, newest first, and the streak ending today or yesterday.
create function public.social_streak(p_user uuid, p_tz text) returns integer
language plpgsql stable set search_path = public, pg_catalog as $$
declare today date := (now() at time zone p_tz)::date; cur date; n int := 0;
begin
  cur := today;
  if not exists (select 1 from xp_events where user_id = p_user and (created_at at time zone p_tz)::date = today and xp > 0) then cur := today - 1; end if;
  while exists (select 1 from xp_events where user_id = p_user and (created_at at time zone p_tz)::date = cur and xp > 0) loop
    n := n + 1; cur := cur - 1;
  end loop;
  return n;
end $$;

-- Per day since the group's first member joined (max 400 days): how many members counted that day (joined on or
-- before it) and how many of them earned at least 1 XP that day. India time.
create function public.social_group_days(p_group uuid) returns jsonb
language sql stable set search_path = public, pg_catalog as $$
  with m as (
    select user_id, (joined_at at time zone 'Asia/Kolkata')::date as jd from group_members where group_id = p_group
  ),
  span as (select greatest(min(jd), social_today() - 400) as s from m),
  days as (select generate_series(span.s, social_today(), interval '1 day')::date as d from span where span.s is not null),
  active as (
    select e.user_id, (e.created_at at time zone 'Asia/Kolkata')::date as d
    from xp_events e join m on m.user_id = e.user_id, span
    where e.created_at >= (span.s::timestamp at time zone 'Asia/Kolkata')
    group by 1, 2 having sum(e.xp) > 0
  ),
  agg as (
    select dd.d,
      count(*) filter (where m.jd <= dd.d) as needed,
      count(*) filter (where m.jd <= dd.d and exists (select 1 from active a where a.user_id = m.user_id and a.d = dd.d)) as done
    from days dd cross join m group by dd.d
  )
  select coalesce(jsonb_agg(jsonb_build_object('day', to_char(d, 'YYYY-MM-DD'), 'needed', needed, 'done', done) order by d), '[]'::jsonb) from agg;
$$;

create function public.social_is_member(p_group uuid, p_user uuid) returns boolean
language sql stable set search_path = public, pg_catalog as $$
  select exists (select 1 from group_members where group_id = p_group and user_id = p_user);
$$;

revoke all on function public.social_first_name(text), public.social_today(), public.social_new_code(), public.social_clean_code(text),
  public.social_limited(uuid, boolean), public.social_streak(uuid, text), public.social_group_days(uuid), public.social_is_member(uuid, uuid)
  from public, anon, authenticated;

-- When a member leaves (or deletes their account) and they owned the group, the longest-standing member takes over.
-- An empty group is deleted.
create function public.social_member_gone() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
declare heir uuid;
begin
  if not exists (select 1 from study_groups where id = old.group_id) then return old; end if;
  select user_id into heir from group_members where group_id = old.group_id order by joined_at, id limit 1;
  if heir is null then
    delete from study_groups where id = old.group_id;
  else
    update study_groups set owner_id = heir where id = old.group_id and (owner_id is null or owner_id = old.user_id);
  end if;
  return old;
end $$;
create trigger group_members_gone after delete on public.group_members for each row execute function public.social_member_gone();
revoke all on function public.social_member_gone() from public, anon, authenticated;

-- ------------------------------------------------------------------ friends
-- The caller's own private invite code (created on first use).
create function public.my_friend_code() returns text
language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); c text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select code into c from friend_codes where user_id = uid;
  if c is null then
    insert into friend_codes (user_id, code) values (uid, social_new_code()) on conflict (user_id) do nothing;
    select code into c from friend_codes where user_id = uid;
  end if;
  return c;
end $$;

-- A new code; the old link stops working. Pending and accepted friendships stay.
create function public.regen_friend_code() returns text
language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); c text := social_new_code();
begin
  if uid is null then raise exception 'not signed in'; end if;
  insert into friend_codes (user_id, code) values (uid, c) on conflict (user_id) do update set code = excluded.code, created_at = now();
  return c;
end $$;

-- Looks at a code before acting on it: whose friend code, or which group. Never says more than a first name / group name.
-- status: friend | group | self | member | not_found | limited. For a friend code, already: '' | sent | incoming | accepted.
create function public.peek_code(p_code text) returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); c text := social_clean_code(p_code); other uuid; g study_groups%rowtype; n int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if social_limited(uid, false) then return jsonb_build_object('status', 'limited'); end if;
  if c is null then perform social_limited(uid, true); return jsonb_build_object('status', 'not_found'); end if;
  select user_id into other from friend_codes where code = c;
  if other is not null then
    if other = uid then return jsonb_build_object('status', 'self'); end if;
    return jsonb_build_object('status', 'friend', 'code', c,
      'display', (select social_first_name(name) from profiles where id = other),
      'already', coalesce((select case when status = 'accepted' then 'accepted' when requester = uid then 'sent' else 'incoming' end
        from friendships where least(requester, addressee) = least(uid, other) and greatest(requester, addressee) = greatest(uid, other)), ''));
  end if;
  select * into g from study_groups where code = c;
  if g.id is not null then
    select count(*) into n from group_members where group_id = g.id;
    return jsonb_build_object('status', case when social_is_member(g.id, uid) then 'member' else 'group' end, 'code', c,
      'id', g.id, 'name', g.name, 'emoji', g.emoji, 'color', g.color, 'members', n);
  end if;
  perform social_limited(uid, true);
  return jsonb_build_object('status', 'not_found');
end $$;

-- Sends a friend request to the owner of a code. If they had already asked you, you become friends straight away.
-- status: sent | accepted | already | pending | self | not_found | limited | full
create function public.send_friend_request(p_code text) returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); c text := social_clean_code(p_code); other uuid; f friendships%rowtype; nm text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if social_limited(uid, false) then return jsonb_build_object('status', 'limited'); end if;
  select user_id into other from friend_codes where code = c;
  if other is null then perform social_limited(uid, true); return jsonb_build_object('status', 'not_found'); end if;
  if other = uid then return jsonb_build_object('status', 'self'); end if;
  select social_first_name(name) into nm from profiles where id = other;
  select * into f from friendships where least(requester, addressee) = least(uid, other) and greatest(requester, addressee) = greatest(uid, other);
  if f.id is not null then
    if f.status = 'accepted' then return jsonb_build_object('status', 'already', 'display', nm); end if;
    if f.addressee = uid then
      update friendships set status = 'accepted', accepted_at = now() where id = f.id;
      return jsonb_build_object('status', 'accepted', 'display', nm);
    end if;
    return jsonb_build_object('status', 'pending', 'display', nm);
  end if;
  if (select count(*) from friendships where requester = uid or addressee = uid) >= 200 then return jsonb_build_object('status', 'full'); end if;
  insert into friendships (requester, addressee) values (uid, other) on conflict do nothing;
  return jsonb_build_object('status', 'sent', 'display', nm);
end $$;

-- Accept a request sent to you (only the person asked can accept).
create function public.accept_friend(p_id uuid) returns boolean
language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); n int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  update friendships set status = 'accepted', accepted_at = now() where id = p_id and addressee = uid and status = 'pending';
  get diagnostics n = row_count;
  return n = 1;
end $$;

-- Decline, cancel or unfriend. Either side may do it.
create function public.remove_friend(p_id uuid) returns boolean
language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); n int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from friendships where id = p_id and (requester = uid or addressee = uid);
  get diagnostics n = row_count;
  return n = 1;
end $$;

-- Everything the /friends page needs: my code, friends (first name, today's XP, streak, studied today), requests,
-- and today's nudges sent to me. Friend numbers use each friend's own timezone so they match what that friend sees.
create function public.friends_overview() returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); out jsonb;
begin
  if uid is null then raise exception 'not signed in'; end if;
  perform my_friend_code();
  select jsonb_build_object(
    'code', (select code from friend_codes where user_id = uid),
    'friends', coalesce((
      select jsonb_agg(jsonb_build_object('id', x.id, 'display', x.display, 'today_xp', x.today_xp, 'streak', x.streak,
        'studied_today', x.today_xp > 0, 'nudged', x.nudged) order by x.today_xp desc, x.display)
      from (
        select f.id, social_first_name(p.name) as display,
          (select coalesce(sum(e.xp), 0) from xp_events e where e.user_id = p.id and (e.created_at at time zone p.timezone)::date = (now() at time zone p.timezone)::date)::bigint as today_xp,
          social_streak(p.id, p.timezone) as streak,
          exists (select 1 from nudges nn where nn.from_user = uid and nn.to_user = p.id and nn.day = social_today()) as nudged
        from friendships f join profiles p on p.id = case when f.requester = uid then f.addressee else f.requester end
        where (f.requester = uid or f.addressee = uid) and f.status = 'accepted'
      ) x), '[]'::jsonb),
    'incoming', coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'display', social_first_name(p.name)) order by f.created_at desc)
      from friendships f join profiles p on p.id = f.requester where f.addressee = uid and f.status = 'pending'), '[]'::jsonb),
    'outgoing', coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'display', social_first_name(p.name)) order by f.created_at desc)
      from friendships f join profiles p on p.id = f.addressee where f.requester = uid and f.status = 'pending'), '[]'::jsonb),
    'nudges', coalesce((
      select jsonb_agg(jsonb_build_object('display', social_first_name(p.name)) order by n.created_at desc)
      from nudges n join profiles p on p.id = n.from_user
      where n.to_user = uid and n.day = social_today()
        and (exists (select 1 from friendships f where f.status = 'accepted' and least(f.requester, f.addressee) = least(uid, n.from_user) and greatest(f.requester, f.addressee) = greatest(uid, n.from_user))
          or exists (select 1 from group_members a join group_members b on b.group_id = a.group_id where a.user_id = uid and b.user_id = n.from_user))), '[]'::jsonb)
  ) into out;
  return out;
end $$;

-- ------------------------------------------------------------------ groups
create function public.create_group(p_name text, p_emoji text, p_color text) returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); gid uuid;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if (select count(*) from group_members where user_id = uid) >= 20 then return jsonb_build_object('status', 'too_many'); end if;
  insert into study_groups (name, emoji, color, code, owner_id)
    values (btrim(p_name), coalesce(nullif(btrim(p_emoji), ''), '📚'), coalesce(p_color, 'green'), social_new_code(), uid) returning id into gid;
  insert into group_members (group_id, user_id) values (gid, uid);
  return jsonb_build_object('status', 'created', 'id', gid);
end $$;

-- status: joined | member | full | too_many | not_found | limited
create function public.join_group(p_code text) returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); c text := social_clean_code(p_code); gid uuid;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if social_limited(uid, false) then return jsonb_build_object('status', 'limited'); end if;
  select id into gid from study_groups where code = c for update;
  if gid is null then perform social_limited(uid, true); return jsonb_build_object('status', 'not_found'); end if;
  if social_is_member(gid, uid) then return jsonb_build_object('status', 'member', 'id', gid); end if;
  if (select count(*) from group_members where group_id = gid) >= 30 then return jsonb_build_object('status', 'full', 'id', gid); end if;
  if (select count(*) from group_members where user_id = uid) >= 20 then return jsonb_build_object('status', 'too_many'); end if;
  insert into group_members (group_id, user_id) values (gid, uid) on conflict do nothing;
  return jsonb_build_object('status', 'joined', 'id', gid);
end $$;

create function public.leave_group(p_group uuid) returns boolean
language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); n int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from group_members where group_id = p_group and user_id = uid;
  get diagnostics n = row_count;
  return n = 1;
end $$;

-- Owner only. p_member is the opaque member handle from group_detail; the owner cannot remove themself (they leave).
create function public.remove_group_member(p_group uuid, p_member uuid) returns boolean
language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); n int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from study_groups where id = p_group and owner_id = uid) then return false; end if;
  delete from group_members where id = p_member and group_id = p_group and user_id <> uid;
  get diagnostics n = row_count;
  return n = 1;
end $$;

-- Owner only: name, emoji, colour and weekly XP goal.
create function public.update_group(p_group uuid, p_name text, p_emoji text, p_color text, p_goal integer) returns boolean
language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); n int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  update study_groups set name = btrim(p_name), emoji = coalesce(nullif(btrim(p_emoji), ''), emoji), color = coalesce(p_color, color), goal_xp = coalesce(p_goal, goal_xp)
    where id = p_group and owner_id = uid;
  get diagnostics n = row_count;
  return n = 1;
end $$;

-- Owner only: a new invite code; the old link stops working.
create function public.regen_group_code(p_group uuid) returns text
language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); c text := social_new_code(); n int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  update study_groups set code = c where id = p_group and owner_id = uid;
  get diagnostics n = row_count;
  return case when n = 1 then c end;
end $$;

-- The caller's groups with today's progress and the day list for the streak.
create function public.my_groups() returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'emoji', g.emoji, 'color', g.color, 'owner', g.owner_id = uid,
      'members', (select count(*) from group_members x where x.group_id = g.id),
      'days', social_group_days(g.id)) order by m.joined_at)
    from group_members m join study_groups g on g.id = m.group_id where m.user_id = uid), '[]'::jsonb);
end $$;

-- One group, for its members only (null otherwise): members by first name with today's and this week's XP,
-- the day list for the group streak, and which members the caller has nudged today.
create function public.group_detail(p_group uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); g study_groups%rowtype; wk timestamp := date_trunc('week', now() at time zone 'Asia/Kolkata');
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not social_is_member(p_group, uid) then return null; end if;
  select * into g from study_groups where id = p_group;
  return jsonb_build_object(
    'id', g.id, 'name', g.name, 'emoji', g.emoji, 'color', g.color, 'code', g.code, 'goal_xp', g.goal_xp,
    'owner', g.owner_id = uid, 'today', to_char(social_today(), 'YYYY-MM-DD'),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object('id', x.id, 'display', x.display, 'today_xp', x.today_xp, 'week_xp', x.week_xp,
        'studied_today', x.today_xp > 0, 'owner', x.user_id = g.owner_id, 'me', x.user_id = uid,
        'joined_today', x.jd = social_today(), 'nudged', x.nudged) order by x.week_xp desc, x.joined_at)
      from (
        select m.id, m.user_id, m.joined_at, (m.joined_at at time zone 'Asia/Kolkata')::date as jd, social_first_name(p.name) as display,
          (select coalesce(sum(e.xp), 0) from xp_events e where e.user_id = m.user_id and (e.created_at at time zone 'Asia/Kolkata')::date = social_today())::bigint as today_xp,
          (select coalesce(sum(e.xp), 0) from xp_events e where e.user_id = m.user_id and (e.created_at at time zone 'Asia/Kolkata') >= wk)::bigint as week_xp,
          exists (select 1 from nudges nn where nn.from_user = uid and nn.to_user = m.user_id and nn.day = social_today()) as nudged
        from group_members m join profiles p on p.id = m.user_id where m.group_id = g.id
      ) x), '[]'::jsonb),
    'days', social_group_days(g.id)
  );
end $$;

-- ------------------------------------------------------------------ nudges
-- p_kind 'friend' (p_id = friendship id) or 'member' (p_id = group member handle). One nudge per pair per day.
-- status: sent | already | not_allowed
create function public.send_nudge(p_kind text, p_id uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); target uuid; n int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_kind = 'friend' then
    select case when requester = uid then addressee else requester end into target
      from friendships where id = p_id and status = 'accepted' and (requester = uid or addressee = uid);
  elsif p_kind = 'member' then
    select m.user_id into target from group_members m where m.id = p_id and social_is_member(m.group_id, uid);
  end if;
  if target is null or target = uid then return jsonb_build_object('status', 'not_allowed'); end if;
  insert into nudges (from_user, to_user, day) values (uid, target, social_today()) on conflict do nothing;
  get diagnostics n = row_count;
  return jsonb_build_object('status', case when n = 1 then 'sent' else 'already' end);
end $$;

-- ------------------------------------------------------------------ grants
revoke all on function public.my_friend_code(), public.regen_friend_code(), public.peek_code(text), public.send_friend_request(text),
  public.accept_friend(uuid), public.remove_friend(uuid), public.friends_overview(), public.create_group(text, text, text),
  public.join_group(text), public.leave_group(uuid), public.remove_group_member(uuid, uuid), public.update_group(uuid, text, text, text, integer),
  public.regen_group_code(uuid), public.my_groups(), public.group_detail(uuid), public.send_nudge(text, uuid)
  from public, anon;
grant execute on function public.my_friend_code(), public.regen_friend_code(), public.peek_code(text), public.send_friend_request(text),
  public.accept_friend(uuid), public.remove_friend(uuid), public.friends_overview(), public.create_group(text, text, text),
  public.join_group(text), public.leave_group(uuid), public.remove_group_member(uuid, uuid), public.update_group(uuid, text, text, text, integer),
  public.regen_group_code(uuid), public.my_groups(), public.group_detail(uuid), public.send_nudge(text, uuid)
  to authenticated;
