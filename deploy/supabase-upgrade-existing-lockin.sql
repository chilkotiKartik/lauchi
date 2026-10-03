-- ==== 0008_push ====
-- lockin. Web Push: one row per browser a student switched reminders on in, and the query the cron job uses to find who is due.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) between 20 and 1000 and endpoint like 'https://%'),
  p256dh text not null check (char_length(p256dh) between 20 and 200),
  auth text not null check (char_length(auth) between 8 and 100),
  remind_streak boolean not null default true,
  remind_exam boolean not null default true,
  study_time time,                       -- optional daily study reminder, in the student's own time zone
  last_streak_on date,                   -- local date of the last reminder of each kind, so we send at most one a day
  last_exam_on date,
  last_study_on date,
  created timestamptz not null default now(),
  last_ok timestamptz
);
create index push_subscriptions_user on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
grant select, delete on public.push_subscriptions to authenticated;
create policy push_select_own on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy push_delete_own on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());
-- Inserts and updates go through the API with the service role (an endpoint can move between students on a shared phone).

-- Who should get a reminder right now? One row per (subscription, kind). Never callable by students.
--   streak: a streak of 1+ days that has no XP yet today, from 18:00 local time
--   exam:   exam_date is exactly 7 days or 1 day away, from 08:00 local time
--   study:  the chosen daily study time has passed (within the last 3 hours)
create function public.reminders_due(p_now timestamptz default now())
returns table (sub_id uuid, user_id uuid, endpoint text, p256dh text, auth text, kind text, streak integer, days_left integer, local_day date)
language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare r record; tz text; local_ts timestamp; today date; cur date; n integer;
begin
  for r in
    select s.*, p.timezone as tz_name, p.exam_date, p.name as pname
    from push_subscriptions s join profiles p on p.id = s.user_id
    where p.onboarded_at is not null
  loop
    begin
      tz := coalesce(nullif(r.tz_name, ''), 'Asia/Kolkata');
      local_ts := p_now at time zone tz;
    exception when others then
      tz := 'Asia/Kolkata'; local_ts := p_now at time zone tz;
    end;
    today := local_ts::date;

    if r.remind_streak and extract(hour from local_ts) >= 18 and r.last_streak_on is distinct from today
       and not exists (select 1 from xp_events e where e.user_id = r.user_id and (e.created_at at time zone tz)::date = today) then
      n := 0; cur := today - 1;
      while exists (select 1 from xp_events e where e.user_id = r.user_id and (e.created_at at time zone tz)::date = cur) loop
        n := n + 1; cur := cur - 1;
      end loop;
      if n > 0 then
        sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
        kind := 'streak'; streak := n; days_left := null; local_day := today;
        return next;
      end if;
    end if;

    if r.remind_exam and r.exam_date is not null and extract(hour from local_ts) >= 8 and r.last_exam_on is distinct from today
       and (r.exam_date - today) in (1, 7) then
      sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
      kind := 'exam'; streak := null; days_left := r.exam_date - today; local_day := today;
      return next;
    end if;

    if r.study_time is not null and r.last_study_on is distinct from today
       and local_ts::time >= r.study_time and local_ts::time < r.study_time + interval '3 hours' and r.study_time < time '21:00' then
      sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
      kind := 'study'; streak := null; days_left := null; local_day := today;
      return next;
    end if;
  end loop;
end $$;
revoke all on function public.reminders_due(timestamptz) from public, anon, authenticated;
grant execute on function public.reminders_due(timestamptz) to service_role;

-- ==== 0009_social ====
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

-- ==== 0010_admin ====
-- lockin. admin panel: admins, teacher-added PYQs, pinned ("Teacher's pick") videos, question reports and anonymous analytics.
--
-- HOW TO MAKE SOMEONE AN ADMIN (nobody is an admin by default):
--   1. They sign in to lockin. once, so their account exists.
--   2. In the Supabase SQL editor run:
--        insert into public.admins (user_id) select id from auth.users where email = 'teacher@example.com';
--      To remove them:  delete from public.admins where user_id = (select id from auth.users where email = 'teacher@example.com');
--   Or, without SQL: set the server env var ADMIN_EMAILS to a comma-separated list of emails (e.g. "a@x.com,b@y.com").
-- The Next.js server re-checks admin rights on every admin page and every admin action (non-admins get a 404).
-- Admin writes go through the service-role client only after that check; students can never write these tables.

-- ------------------------------------------------------------------ admins
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- a signed-in user can only ever see whether they themselves are an admin
create policy admins_select_own on public.admins for select to authenticated using (user_id = auth.uid());
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;
grant all on public.admins to service_role;

-- ------------------------------------------------------------------ custom PYQs
create table public.custom_pyqs (
  id uuid primary key default gen_random_uuid(),
  course text not null check (course ~ '^[A-Z]{2,3}-[0-9]{3}$'),
  unit smallint not null check (unit between 1 and 12),
  kind text not null check (kind in ('theory', 'numerical')),
  title text not null check (char_length(title) between 1 and 300),
  parts jsonb not null default '[]' check (jsonb_typeof(parts) = 'array' and jsonb_array_length(parts) between 1 and 12),
  marks text check (marks is null or char_length(marks) <= 20),
  repeated integer not null default 1 check (repeated between 0 and 50),
  year text check (year is null or char_length(year) <= 60),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  hidden boolean not null default false
);
create index custom_pyqs_course_unit on public.custom_pyqs (course, unit);
alter table public.custom_pyqs enable row level security;
create policy custom_pyqs_select_visible on public.custom_pyqs for select to authenticated using (not hidden);
revoke all on public.custom_pyqs from anon, authenticated;
grant select on public.custom_pyqs to authenticated;
grant all on public.custom_pyqs to service_role;

-- ------------------------------------------------------------------ pinned videos
create table public.pinned_videos (
  id uuid primary key default gen_random_uuid(),
  course text not null check (course ~ '^[A-Z]{2,3}-[0-9]{3}$'),
  unit smallint not null check (unit between 1 and 12),
  topic text check (topic is null or topic ~ '^[0-9]{1,3}$'),
  video_id text not null check (video_id ~ '^[A-Za-z0-9_-]{11}$'),
  title text not null check (char_length(title) between 1 and 140),
  channel text not null default '' check (char_length(channel) <= 80),
  note text not null default '' check (char_length(note) <= 200),
  position integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index pinned_videos_course_unit on public.pinned_videos (course, unit, position);
alter table public.pinned_videos enable row level security;
create policy pinned_videos_select_all on public.pinned_videos for select to authenticated using (true);
revoke all on public.pinned_videos from anon, authenticated;
grant select on public.pinned_videos to authenticated;
grant all on public.pinned_videos to service_role;

-- ------------------------------------------------------------------ question reports
create table public.question_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('quiz', 'pyq', 'lesson')),
  ref text not null check (char_length(ref) between 1 and 200),
  course text check (course is null or course ~ '^[A-Z]{2,3}-[0-9]{3}$'),
  unit smallint check (unit is null or unit between 1 and 12),
  text text not null check (char_length(text) between 1 and 500),
  status text not null default 'open' check (status in ('open', 'fixed', 'ignored')),
  fix_note text not null default '' check (char_length(fix_note) <= 500),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index question_reports_status_time on public.question_reports (status, created_at desc);
create index question_reports_user_time on public.question_reports (user_id, created_at desc);
alter table public.question_reports enable row level security;
create policy question_reports_select_own on public.question_reports for select to authenticated using (user_id = auth.uid());
revoke all on public.question_reports from anon, authenticated;
grant select (id, source, ref, course, unit, text, status, created_at) on public.question_reports to authenticated;
grant all on public.question_reports to service_role;

-- A signed-in student files a report. At most p_limit per student per day (India time). Returns false once the limit is hit.
create function public.submit_question_report(p_source text, p_ref text, p_course text, p_unit integer, p_text text, p_limit integer default 20)
returns boolean language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); used integer;
begin
  if uid is null then raise exception 'not signed in'; end if;
  perform pg_advisory_xact_lock(hashtext('question_reports:' || uid::text));
  select count(*) into used from question_reports
    where user_id = uid and (created_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date;
  if used >= least(greatest(coalesce(p_limit, 20), 1), 20) then return false; end if;
  insert into question_reports (user_id, source, ref, course, unit, text) values (uid, p_source, btrim(p_ref), p_course, p_unit, btrim(p_text));
  return true;
end $$;
revoke all on function public.submit_question_report(text, text, text, integer, text, integer) from public, anon;
grant execute on function public.submit_question_report(text, text, text, integer, text, integer) to authenticated, service_role;

-- ------------------------------------------------------------------ anonymous analytics
-- Aggregates only. Any group with fewer than 5 distinct students is left out (k-anonymity), and no ids, names or
-- emails ever leave this function. Callable only by the service role (the Next.js server calls it after isAdmin()).
create function public.admin_analytics(p_days integer default 7) returns jsonb
language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare d integer := least(greatest(coalesce(p_days, 7), 1), 90); since timestamptz; k constant integer := 5; units jsonb; days jsonb; reports jsonb; totals jsonb;
begin
  since := (date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata') - make_interval(days => d - 1);

  with a as (
    -- mock sessions span units: each answer then records its own unit in 'u'
    select s.course, case when e.value->>'u' ~ '^[0-9]{1,2}$' then (e.value->>'u')::integer else s.unit end as unit, s.user_id, coalesce((e.value->>'ok')::boolean, false) as ok
    from quiz_sessions s cross join lateral jsonb_each(s.answers) e
    where s.created_at >= since and jsonb_typeof(e.value) = 'object'
  ), g as (
    select course, unit, count(distinct user_id) as students, count(*) as attempts, count(*) filter (where ok) as correct
    from a group by course, unit
  )
  select coalesce(jsonb_agg(jsonb_build_object('course', course, 'unit', unit, 'students', students, 'attempts', attempts,
           'correct', correct, 'accuracy', round(100.0 * correct / attempts)) order by (1.0 * correct / attempts), attempts desc, course, unit), '[]')
    into units from g where students >= k and attempts > 0;

  with act as (
    select user_id, (created_at at time zone 'Asia/Kolkata')::date as day from quiz_sessions where created_at >= since
    union
    select user_id, (created_at at time zone 'Asia/Kolkata')::date from xp_events where created_at >= since
  ), per as (select day, count(distinct user_id) as n from act group by day),
  series as (select generate_series((since at time zone 'Asia/Kolkata')::date, (now() at time zone 'Asia/Kolkata')::date, interval '1 day')::date as day)
  select coalesce(jsonb_agg(jsonb_build_object('day', series.day, 'students', case when per.n >= k then per.n end) order by series.day), '[]')
    into days from series left join per on per.day = series.day;

  -- reports are about questions, not students: the reporter is never shown
  select coalesce(jsonb_agg(jsonb_build_object('source', source, 'ref', ref, 'course', course, 'unit', unit, 'reports', n, 'open', o) order by n desc, last desc), '[]')
    into reports from (
      select source, ref, min(course) as course, min(unit) as unit, count(*) as n, count(*) filter (where status = 'open') as o, max(created_at) as last
      from question_reports where created_at >= since group by source, ref order by n desc, last desc limit 10
    ) r;

  with t as (
    select count(distinct s.user_id) as students, count(distinct s.id) as quizzes
    from quiz_sessions s where s.created_at >= since
  )
  select jsonb_build_object('students', case when students >= k then students end, 'quizzes', case when students >= k then quizzes end)
    into totals from t;

  return jsonb_build_object('days', d, 'k', k, 'since', since, 'units', units, 'daily', days, 'top_reported', reports, 'totals', totals);
end $$;
revoke all on function public.admin_analytics(integer) from public, anon, authenticated;
grant execute on function public.admin_analytics(integer) to service_role;

-- ==== 0011_papers ====
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

-- ==== 0013_streams ====
-- The app serves CSE, AIML and BCA only. NOT VALID: rows from older branches are not re-checked, new/updated rows must use the three.
alter table public.profiles drop constraint if exists profiles_branch_check;
alter table public.profiles add constraint profiles_branch_check
  check (branch in ('CSE','AIML','BCA')) not valid;

-- ==== 0015_engagement ====
-- lockin. Daily 5-question challenge, streak freezes, weekly goals and the "daily" push reminder.

-- ------------------------------------------------------------------ daily challenge
-- One row per student per India day. `items` (which template/seed each question comes from) and `answers` are never
-- readable by clients; the server grades and calls daily_answer().
create table public.daily_challenges (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 10),
  answers jsonb not null default '{}',
  score integer,
  xp integer,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.daily_challenges enable row level security;
create policy daily_select_own on public.daily_challenges for select to authenticated using (user_id = auth.uid());
revoke all on public.daily_challenges from anon, authenticated;
grant select (user_id, day, score, xp, completed_at, created_at) on public.daily_challenges to authenticated;

-- Stores one graded answer. The first answer to a question stands. When the last one arrives the challenge completes
-- and pays XP once (award_xp ignores a repeated (user, kind, ref)).
create function public.daily_answer(p_user uuid, p_day date, p_index integer, p_answer jsonb, p_ok boolean) returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare c daily_challenges; n_total integer; n_answered integer; n_ok integer; gained integer := 0; paid integer;
begin
  if p_day <> (now() at time zone 'Asia/Kolkata')::date then raise exception 'wrong day'; end if;
  select * into c from daily_challenges where user_id = p_user and day = p_day for update;
  if not found then raise exception 'no challenge'; end if;
  if c.completed_at is not null then raise exception 'already completed'; end if;
  n_total := jsonb_array_length(c.items);
  if p_index < 0 or p_index >= n_total then raise exception 'bad index'; end if;
  if not (c.answers ? p_index::text) then
    c.answers := c.answers || jsonb_build_object(p_index::text, jsonb_build_object('a', p_answer, 'ok', p_ok));
  end if;
  select count(*), count(*) filter (where (v ->> 'ok')::boolean) into n_answered, n_ok from jsonb_each(c.answers) e(k, v);
  if n_answered < n_total then
    update daily_challenges set answers = c.answers where user_id = p_user and day = p_day;
    return jsonb_build_object('done', false, 'answered', n_answered, 'total', n_total);
  end if;
  gained := 5 + n_ok * 4 + case when n_ok = n_total then 10 else 0 end;
  paid := award_xp(p_user, 'quiz_completed', 'daily:' || p_day::text, gained);
  update daily_challenges set answers = c.answers, score = n_ok, xp = paid, completed_at = now() where user_id = p_user and day = p_day;
  return jsonb_build_object('done', true, 'answered', n_answered, 'total', n_total, 'score', n_ok, 'xp', paid);
end $$;
revoke all on function public.daily_answer(uuid, date, integer, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.daily_answer(uuid, date, integer, jsonb, boolean) to service_role;

-- ------------------------------------------------------------------ streak freezes
-- Replay rule (the only place it lives; src/lib/streak.ts mirrors it for tests): walk the days up to yesterday.
-- An active day (XP > 0) adds 1 to the run and every 7th run day banks a freeze (max 2). A missed day spends a
-- banked freeze if the run is alive, otherwise the run resets to 0. Today never costs a freeze.
create table public.streak_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  checked_through date not null,
  run integer not null default 0,
  banked integer not null default 0 check (banked between 0 and 2)
);
alter table public.streak_state enable row level security;
create policy streak_state_select_own on public.streak_state for select to authenticated using (user_id = auth.uid());
revoke all on public.streak_state from anon, authenticated;
grant select on public.streak_state to authenticated;

create table public.streak_freezes (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);
alter table public.streak_freezes enable row level security;
create policy streak_freezes_select_own on public.streak_freezes for select to authenticated using (user_id = auth.uid());
revoke all on public.streak_freezes from anon, authenticated;
grant select on public.streak_freezes to authenticated;

create function public.streak_calc(p_user uuid, p_tz text)
returns table (streak integer, freezes integer, ck_day date, ck_run integer, ck_banked integer, frozen date[])
language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare st streak_state; today date := (now() at time zone p_tz)::date; d date; run integer := 0; banked integer := 0;
        days date[]; fr date[] := '{}'; first_day date; today_on boolean;
begin
  select * into st from streak_state where user_id = p_user;
  if found then d := st.checked_through + 1; run := st.run; banked := st.banked;
  else
    select min((created_at at time zone p_tz)::date) into first_day from xp_events where user_id = p_user and xp > 0;
    if first_day is null then
      streak := 0; freezes := 0; ck_day := today - 1; ck_run := 0; ck_banked := 0; frozen := fr; return next; return;
    end if;
    d := greatest(first_day, today - 400);
  end if;
  select coalesce(array_agg(distinct (created_at at time zone p_tz)::date), '{}') into days
    from xp_events where user_id = p_user and xp > 0 and (created_at at time zone p_tz)::date >= d;
  while d < today loop
    if d = any(days) then
      run := run + 1;
      if run % 7 = 0 then banked := least(2, banked + 1); end if;
    elsif run > 0 and banked > 0 then
      banked := banked - 1; fr := fr || d;
    else
      run := 0;
    end if;
    d := d + 1;
  end loop;
  today_on := today = any(days);
  streak := run + case when today_on then 1 else 0 end;
  freezes := least(2, banked + case when today_on and (run + 1) % 7 = 0 then 1 else 0 end);
  ck_day := today - 1; ck_run := run; ck_banked := banked; frozen := fr;
  return next;
end $$;
revoke all on function public.streak_calc(uuid, text) from public, anon, authenticated;
grant execute on function public.streak_calc(uuid, text) to service_role;

-- Saves the checkpoint and the freeze days that were spent. Idempotent: running it twice in a day changes nothing.
create function public.sync_streak(p_user uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare tz text; c record; fd date;
begin
  select timezone into tz from profiles where id = p_user;
  if tz is null then raise exception 'unknown user'; end if;
  select * into c from streak_calc(p_user, tz);
  if exists (select 1 from xp_events where user_id = p_user and xp > 0) then
    insert into streak_state (user_id, checked_through, run, banked) values (p_user, c.ck_day, c.ck_run, c.ck_banked)
      on conflict (user_id) do update set checked_through = excluded.checked_through, run = excluded.run, banked = excluded.banked
      where streak_state.checked_through < excluded.checked_through;
    foreach fd in array c.frozen loop
      insert into streak_freezes (user_id, day) values (p_user, fd) on conflict do nothing;
    end loop;
  end if;
  return jsonb_build_object('streak', c.streak, 'freezes', c.freezes);
end $$;
revoke all on function public.sync_streak(uuid) from public, anon, authenticated;
grant execute on function public.sync_streak(uuid) to service_role;

-- Same output as before plus `freezes`; the streak now honours freezes. Persists the checkpoint (idempotent per day).
create or replace function public.dashboard_stats() returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare uid uuid := auth.uid(); tz text; today date; total bigint; today_xp bigint; week jsonb; c record;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select timezone into tz from profiles where id = uid;
  if tz is null then raise exception 'no profile'; end if;
  today := (now() at time zone tz)::date;
  select coalesce(sum(xp), 0) into total from xp_events where user_id = uid;
  select coalesce(sum(xp), 0) into today_xp from xp_events where user_id = uid and (created_at at time zone tz)::date = today;
  select * into c from streak_calc(uid, tz);
  if not exists (select 1 from streak_state where user_id = uid and checked_through >= c.ck_day) then perform sync_streak(uid); end if;
  select coalesce(jsonb_object_agg(d, s), '{}') into week from (
    select (created_at at time zone tz)::date d, sum(xp) s from xp_events
    where user_id = uid and (created_at at time zone tz)::date > today - 84 group by 1) t;
  return jsonb_build_object('total_xp', total, 'today_xp', today_xp, 'streak', c.streak, 'freezes', c.freezes, 'today', today, 'days', week);
end $$;
revoke all on function public.dashboard_stats() from public, anon;
grant execute on function public.dashboard_stats() to authenticated;

-- Friends and groups show the same streak number.
create or replace function public.social_streak(p_user uuid, p_tz text) returns integer
language sql stable set search_path = public, pg_catalog as $$
  select streak from streak_calc(p_user, p_tz)
$$;

-- ------------------------------------------------------------------ weekly goals
create table public.weekly_goals (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  xp_target integer not null check (xp_target between 10 and 5000),
  quizzes_target integer not null check (quizzes_target between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);
alter table public.weekly_goals enable row level security;
create policy weekly_goals_select_own on public.weekly_goals for select to authenticated using (user_id = auth.uid());
revoke all on public.weekly_goals from anon, authenticated;
grant select on public.weekly_goals to authenticated;
-- Writes go through the server action (service role) after zod validation.

-- XP and finished quizzes (quiz sessions + daily challenges) per India week (Mon-Sun) from p_from (a Monday) on.
create function public.weekly_progress(p_user uuid, p_from date) returns table (week_start date, xp bigint, quizzes bigint)
language sql stable security definer set search_path = public, pg_catalog as $$
  with x as (
    select date_trunc('week', (created_at at time zone 'Asia/Kolkata'))::date as w, sum(xp)::bigint as xp
    from xp_events where user_id = p_user and (created_at at time zone 'Asia/Kolkata')::date >= p_from group by 1
  ), q as (
    select w, count(*)::bigint as n from (
      select date_trunc('week', (submitted_at at time zone 'Asia/Kolkata'))::date as w from quiz_sessions
        where user_id = p_user and submitted_at is not null and (submitted_at at time zone 'Asia/Kolkata')::date >= p_from
      union all
      select date_trunc('week', day::timestamp)::date from daily_challenges
        where user_id = p_user and completed_at is not null and day >= p_from
    ) t group by w
  )
  select coalesce(x.w, q.w), coalesce(x.xp, 0), coalesce(q.n, 0) from x full join q on q.w = x.w order by 1
$$;
revoke all on function public.weekly_progress(uuid, date) from public, anon, authenticated;
grant execute on function public.weekly_progress(uuid, date) to service_role;

-- ------------------------------------------------------------------ push: "daily" reminder at 17:00 local
alter table public.push_subscriptions add column last_daily_on date;

create or replace function public.reminders_due(p_now timestamptz default now())
returns table (sub_id uuid, user_id uuid, endpoint text, p256dh text, auth text, kind text, streak integer, days_left integer, local_day date)
language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare r record; tz text; local_ts timestamp; today date; cur date; n integer;
begin
  for r in
    select s.*, p.timezone as tz_name, p.exam_date, p.name as pname
    from push_subscriptions s join profiles p on p.id = s.user_id
    where p.onboarded_at is not null
  loop
    begin
      tz := coalesce(nullif(r.tz_name, ''), 'Asia/Kolkata');
      local_ts := p_now at time zone tz;
    exception when others then
      tz := 'Asia/Kolkata'; local_ts := p_now at time zone tz;
    end;
    today := local_ts::date;

    if r.remind_streak and extract(hour from local_ts) >= 18 and r.last_streak_on is distinct from today
       and not exists (select 1 from xp_events e where e.user_id = r.user_id and (e.created_at at time zone tz)::date = today) then
      n := 0; cur := today - 1;
      while exists (select 1 from xp_events e where e.user_id = r.user_id and (e.created_at at time zone tz)::date = cur) loop
        n := n + 1; cur := cur - 1;
      end loop;
      if n > 0 then
        sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
        kind := 'streak'; streak := n; days_left := null; local_day := today;
        return next;
      end if;
    end if;

    if r.remind_exam and r.exam_date is not null and extract(hour from local_ts) >= 8 and r.last_exam_on is distinct from today
       and (r.exam_date - today) in (1, 7) then
      sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
      kind := 'exam'; streak := null; days_left := r.exam_date - today; local_day := today;
      return next;
    end if;

    if r.study_time is not null and r.last_study_on is distinct from today
       and local_ts::time >= r.study_time and local_ts::time < r.study_time + interval '3 hours' and r.study_time < time '21:00' then
      sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
      kind := 'study'; streak := null; days_left := null; local_day := today;
      return next;
    end if;

    -- today's 5-question challenge is not finished: from 17:00 to 22:00, once a day (rides on the streak reminder switch)
    if r.remind_streak and extract(hour from local_ts) >= 17 and extract(hour from local_ts) < 22 and r.last_daily_on is distinct from today
       and not exists (select 1 from daily_challenges d where d.user_id = r.user_id and d.day = (p_now at time zone 'Asia/Kolkata')::date and d.completed_at is not null) then
      sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
      kind := 'daily'; streak := (select c.streak from streak_calc(r.user_id, tz) c); days_left := null; local_day := today;
      return next;
    end if;
  end loop;
end $$;
revoke all on function public.reminders_due(timestamptz) from public, anon, authenticated;
grant execute on function public.reminders_due(timestamptz) to service_role;

-- ==== 0016_classes ====
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

-- ==== 0017_doubts ====
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

-- ==== 0018_cms_questions ====
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

-- ==== 0019_cms_lessons ====
-- lockin. admin CMS: lessons and lab questions. Admin writes go through server actions (service role) after requireAdmin().
-- Students can read PUBLISHED rows only (RLS). Drafts are invisible to them.

create table public.cms_lessons (
  id uuid primary key default gen_random_uuid(),
  course text not null check (course ~ '^[A-Z]{2,3}-[0-9]{3}$'),
  unit smallint not null check (unit between 1 and 12),
  topic smallint not null check (topic between 1 and 200),
  title text not null default '' check (char_length(title) <= 200),
  body jsonb not null check (jsonb_typeof(body) = 'object'),
  status text not null default 'draft' check (status in ('draft', 'published')),
  version integer not null default 1,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index cms_lessons_one_published on public.cms_lessons (course, unit, topic) where status = 'published';
create index cms_lessons_lookup on public.cms_lessons (course, unit, topic);
alter table public.cms_lessons enable row level security;
create policy cms_lessons_select_published on public.cms_lessons for select to authenticated using (status = 'published');
revoke all on public.cms_lessons from anon, authenticated;
grant select on public.cms_lessons to authenticated;
grant all on public.cms_lessons to service_role;

create table public.cms_lab_questions (
  id uuid primary key default gen_random_uuid(),
  lab_id text not null check (lab_id ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  kind text not null check (kind in ('mcq', 'tf', 'numeric')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  status text not null default 'draft' check (status in ('draft', 'published')),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cms_lab_questions_lab on public.cms_lab_questions (lab_id, status);
alter table public.cms_lab_questions enable row level security;
create policy cms_lab_questions_select_published on public.cms_lab_questions for select to authenticated using (status = 'published');
revoke all on public.cms_lab_questions from anon, authenticated;
grant select on public.cms_lab_questions to authenticated;
grant all on public.cms_lab_questions to service_role;

-- Admin dashboard numbers in one call (service role only). Dates are India time.
create function public.admin_stats() returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  tz text := 'Asia/Kolkata';
  today date := (now() at time zone tz)::date;
  r jsonb;
begin
  with act as (
    select user_id, (created_at at time zone tz)::date as d from public.xp_events where created_at > now() - interval '8 days'
    union
    select user_id, (created_at at time zone tz)::date from public.quiz_sessions where created_at > now() - interval '8 days'
  )
  select jsonb_build_object(
    'students', (select count(*) from public.profiles where onboarded_at is not null),
    'by_branch', coalesce((select jsonb_object_agg(coalesce(branch, 'unknown'), n) from (select branch, count(*) n from public.profiles where onboarded_at is not null group by branch) b), '{}'::jsonb),
    'dau', (select count(distinct user_id) from act where d = today),
    'wau', (select count(distinct user_id) from act where d > today - 7),
    'quizzes_per_day', coalesce((select jsonb_object_agg(d, n) from (select (created_at at time zone tz)::date d, count(*) n from public.quiz_sessions where created_at > now() - interval '15 days' group by 1) q), '{}'::jsonb),
    'open_reports', (select count(*) from public.question_reports where status = 'open'),
    'resources', (select count(*) from public.resources where not hidden),
    'lessons_published', (select count(*) from public.cms_lessons where status = 'published'),
    'lab_questions_published', (select count(*) from public.cms_lab_questions where status = 'published'),
    'today', today
  ) into r;
  return r;
end $$;
revoke all on function public.admin_stats() from public, anon, authenticated;
grant execute on function public.admin_stats() to service_role;

-- service_role (the Next.js server) must be able to use every table above; students keep only the grants set per table.
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;


-- ==== 0021_security_hardening ====
-- lockin. security hardening.
-- 1. Undo 0020: the quiz write functions trust p_user and p_correct, so they must only ever be called by the Next.js server
--    (service role) after it has verified the signed-in user and graded the answer itself. Granting them to `authenticated`
--    let any student call them through the REST API with p_correct = true (free XP, league rank, topic completions) or with
--    another student's id.
-- 2. One streak rule everywhere: class rosters and streak reminders now honour streak freezes, like the dashboard and friends.
-- 3. Limits that used to live only in app code are enforced in the database too (doubts per day, exam tasks per student).

-- ------------------------------------------------------------------ 1. quiz write path: service role only
revoke execute on function public.start_quiz_session(uuid, text, integer, integer, text, text, integer) from public, anon, authenticated;
revoke execute on function public.record_answer(uuid, uuid, integer, jsonb, boolean) from public, anon, authenticated;
revoke execute on function public.record_answer_tagged(uuid, uuid, integer, jsonb, boolean, integer, integer, integer) from public, anon, authenticated;
revoke execute on function public.finish_quiz_session(uuid, uuid) from public, anon, authenticated;
grant execute on function public.start_quiz_session(uuid, text, integer, integer, text, text, integer) to service_role;
grant execute on function public.record_answer(uuid, uuid, integer, jsonb, boolean) to service_role;
grant execute on function public.record_answer_tagged(uuid, uuid, integer, jsonb, boolean, integer, integer, integer) to service_role;
grant execute on function public.finish_quiz_session(uuid, uuid) to service_role;

-- ------------------------------------------------------------------ 2. one streak rule
create or replace function public.class_streak(p_user uuid, p_tz text) returns integer
language sql stable set search_path = public, pg_catalog as $$
  select streak from streak_calc(p_user, p_tz)
$$;
revoke all on function public.class_streak(uuid, text) from public, anon, authenticated;
grant execute on function public.class_streak(uuid, text) to service_role;

create or replace function public.reminders_due(p_now timestamptz default now())
returns table (sub_id uuid, user_id uuid, endpoint text, p256dh text, auth text, kind text, streak integer, days_left integer, local_day date)
language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare r record; tz text; local_ts timestamp; today date; n integer;
begin
  for r in
    select s.*, p.timezone as tz_name, p.exam_date
    from push_subscriptions s join profiles p on p.id = s.user_id
    where p.onboarded_at is not null
  loop
    begin
      tz := coalesce(nullif(r.tz_name, ''), 'Asia/Kolkata');
      local_ts := p_now at time zone tz;
    exception when others then
      tz := 'Asia/Kolkata'; local_ts := p_now at time zone tz;
    end;
    today := local_ts::date;

    -- a live streak (freezes included) with no XP yet today, from 18:00 local time
    if r.remind_streak and extract(hour from local_ts) >= 18 and r.last_streak_on is distinct from today
       and not exists (select 1 from xp_events e where e.user_id = r.user_id and (e.created_at at time zone tz)::date = today) then
      n := (select c.streak from streak_calc(r.user_id, tz) c);
      if n > 0 then
        sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
        kind := 'streak'; streak := n; days_left := null; local_day := today;
        return next;
      end if;
    end if;

    if r.remind_exam and r.exam_date is not null and extract(hour from local_ts) >= 8 and r.last_exam_on is distinct from today
       and (r.exam_date - today) in (1, 7) then
      sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
      kind := 'exam'; streak := null; days_left := r.exam_date - today; local_day := today;
      return next;
    end if;

    if r.study_time is not null and r.last_study_on is distinct from today
       and local_ts::time >= r.study_time and local_ts::time < r.study_time + interval '3 hours' and r.study_time < time '21:00' then
      sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
      kind := 'study'; streak := null; days_left := null; local_day := today;
      return next;
    end if;

    if r.remind_streak and extract(hour from local_ts) >= 17 and extract(hour from local_ts) < 22 and r.last_daily_on is distinct from today
       and not exists (select 1 from daily_challenges d where d.user_id = r.user_id and d.day = (p_now at time zone 'Asia/Kolkata')::date and d.completed_at is not null) then
      sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
      kind := 'daily'; streak := (select c.streak from streak_calc(r.user_id, tz) c); days_left := null; local_day := today;
      return next;
    end if;
  end loop;
end $$;
revoke all on function public.reminders_due(timestamptz) from public, anon, authenticated;
grant execute on function public.reminders_due(timestamptz) to service_role;

-- ------------------------------------------------------------------ 3. limits in the database
-- At most 10 doubts per student in any 24 hours (the server checks too; this closes direct inserts and double submits).
create or replace function public.doubts_limit() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  perform pg_advisory_xact_lock(hashtext('doubts:' || new.user_id::text));
  if (select count(*) from doubts where user_id = new.user_id and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'too many doubts today';
  end if;
  return new;
end $$;
revoke all on function public.doubts_limit() from public, anon, authenticated;
drop trigger if exists doubts_limit on public.doubts;
create trigger doubts_limit before insert on public.doubts for each row execute function public.doubts_limit();

-- At most 2000 exam tasks per student (a full schedule is well under 1000), so the table cannot be used as free storage.
create or replace function public.exam_tasks_limit() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if (select count(*) from exam_tasks where user_id = new.user_id) >= 2000 then
    raise exception 'too many exam tasks';
  end if;
  return new;
end $$;
revoke all on function public.exam_tasks_limit() from public, anon, authenticated;
drop trigger if exists exam_tasks_limit on public.exam_tasks;
create trigger exam_tasks_limit before insert on public.exam_tasks for each row execute function public.exam_tasks_limit();

-- Only one AI first answer per doubt, even when the button is pressed twice at once. Older duplicates keep the first one.
delete from public.doubt_answers a using public.doubt_answers b
  where a.author_kind = 'ai' and b.author_kind = 'ai' and a.doubt_id = b.doubt_id
    and (a.created_at, a.id) > (b.created_at, b.id);
create unique index if not exists doubt_answers_one_ai on public.doubt_answers (doubt_id) where author_kind = 'ai';

-- ==== 0022_sunday_quest ====
-- lockin. Sunday Quest: once a week (Sunday, India time) a 12-question quest built from the units the student practised
-- Monday to Saturday, weighted to the units they got wrong. Like the daily challenge, `items` (template/seed per question)
-- and `answers` are never readable by clients; the server grades every answer and calls sunday_answer().

create table public.sunday_quests (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null check (extract(isodow from day) = 7),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 20),
  units jsonb not null default '[]' check (jsonb_typeof(units) = 'array'),
  answers jsonb not null default '{}',
  score integer,
  xp integer,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.sunday_quests enable row level security;
create policy sunday_select_own on public.sunday_quests for select to authenticated using (user_id = auth.uid());
revoke all on public.sunday_quests from anon, authenticated;
grant select (user_id, day, units, score, xp, completed_at, created_at) on public.sunday_quests to authenticated;
grant all on public.sunday_quests to service_role;

-- Stores one graded answer (the first answer to a question stands). The last answer completes the quest and pays XP once:
-- 10 for finishing, 4 per correct answer, +20 for 80% or better (award_xp ignores a repeated (user, kind, ref)).
create function public.sunday_answer(p_user uuid, p_day date, p_index integer, p_answer jsonb, p_ok boolean) returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare q sunday_quests; n_total integer; n_answered integer; n_ok integer; gained integer; paid integer;
begin
  if p_day <> (now() at time zone 'Asia/Kolkata')::date or extract(isodow from p_day) <> 7 then raise exception 'quest closed'; end if;
  select * into q from sunday_quests where user_id = p_user and day = p_day for update;
  if not found then raise exception 'no quest'; end if;
  if q.completed_at is not null then raise exception 'already completed'; end if;
  n_total := jsonb_array_length(q.items);
  if p_index < 0 or p_index >= n_total then raise exception 'bad index'; end if;
  if not (q.answers ? p_index::text) then
    q.answers := q.answers || jsonb_build_object(p_index::text, jsonb_build_object('a', p_answer, 'ok', p_ok));
  end if;
  select count(*), count(*) filter (where (v ->> 'ok')::boolean) into n_answered, n_ok from jsonb_each(q.answers) e(k, v);
  if n_answered < n_total then
    update sunday_quests set answers = q.answers where user_id = p_user and day = p_day;
    return jsonb_build_object('done', false, 'answered', n_answered, 'total', n_total);
  end if;
  gained := 10 + n_ok * 4 + case when n_ok * 5 >= n_total * 4 then 20 else 0 end;
  paid := award_xp(p_user, 'quiz_completed', 'sunday:' || p_day::text, gained);
  update sunday_quests set answers = q.answers, score = n_ok, xp = paid, completed_at = now() where user_id = p_user and day = p_day;
  return jsonb_build_object('done', true, 'answered', n_answered, 'total', n_total, 'score', n_ok, 'xp', paid);
end $$;
revoke all on function public.sunday_answer(uuid, date, integer, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.sunday_answer(uuid, date, integer, jsonb, boolean) to service_role;

-- ------------------------------------------------------------------ reminders: Saturday "prepare" and Sunday "it's open"
alter table public.push_subscriptions add column if not exists last_sunday_on date;

create or replace function public.reminders_due(p_now timestamptz default now())
returns table (sub_id uuid, user_id uuid, endpoint text, p256dh text, auth text, kind text, streak integer, days_left integer, local_day date)
language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare r record; tz text; local_ts timestamp; today date; n integer; india date := (p_now at time zone 'Asia/Kolkata')::date;
begin
  for r in
    select s.*, p.timezone as tz_name, p.exam_date
    from push_subscriptions s join profiles p on p.id = s.user_id
    where p.onboarded_at is not null
  loop
    begin
      tz := coalesce(nullif(r.tz_name, ''), 'Asia/Kolkata');
      local_ts := p_now at time zone tz;
    exception when others then
      tz := 'Asia/Kolkata'; local_ts := p_now at time zone tz;
    end;
    today := local_ts::date;

    if r.remind_streak and extract(hour from local_ts) >= 18 and r.last_streak_on is distinct from today
       and not exists (select 1 from xp_events e where e.user_id = r.user_id and (e.created_at at time zone tz)::date = today) then
      n := (select c.streak from streak_calc(r.user_id, tz) c);
      if n > 0 then
        sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
        kind := 'streak'; streak := n; days_left := null; local_day := today;
        return next;
      end if;
    end if;

    if r.remind_exam and r.exam_date is not null and extract(hour from local_ts) >= 8 and r.last_exam_on is distinct from today
       and (r.exam_date - today) in (1, 7) then
      sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
      kind := 'exam'; streak := null; days_left := r.exam_date - today; local_day := today;
      return next;
    end if;

    if r.study_time is not null and r.last_study_on is distinct from today
       and local_ts::time >= r.study_time and local_ts::time < r.study_time + interval '3 hours' and r.study_time < time '21:00' then
      sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
      kind := 'study'; streak := null; days_left := null; local_day := today;
      return next;
    end if;

    if r.remind_streak and extract(hour from local_ts) >= 17 and extract(hour from local_ts) < 22 and r.last_daily_on is distinct from today
       and not exists (select 1 from daily_challenges d where d.user_id = r.user_id and d.day = india and d.completed_at is not null) then
      sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
      kind := 'daily'; streak := (select c.streak from streak_calc(r.user_id, tz) c); days_left := null; local_day := today;
      return next;
    end if;

    -- Sunday Quest (India days): Saturday 18:00–22:00 "prepare for tomorrow", Sunday 09:00–21:00 "your quest is open"
    if r.remind_streak and r.last_sunday_on is distinct from today then
      if extract(isodow from india) = 6 and extract(hour from local_ts) between 18 and 21 then
        sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
        kind := 'sunday_prep'; streak := null; days_left := 1; local_day := today;
        return next;
      elsif extract(isodow from india) = 7 and extract(hour from local_ts) between 9 and 20
        and not exists (select 1 from sunday_quests q where q.user_id = r.user_id and q.day = india and q.completed_at is not null) then
        sub_id := r.id; user_id := r.user_id; endpoint := r.endpoint; p256dh := r.p256dh; auth := r.auth;
        kind := 'sunday'; streak := null; days_left := 0; local_day := today;
        return next;
      end if;
    end if;
  end loop;
end $$;
revoke all on function public.reminders_due(timestamptz) from public, anon, authenticated;
grant execute on function public.reminders_due(timestamptz) to service_role;

-- ==== 0023_resource_view_only ====
-- lockin. View-only notes: an admin decides per file whether students may download it. Default is view-only, so a
-- PDF uploaded for reading is shown inside the app (streamed through the server, never as a storage link) and cannot be
-- downloaded from the Notes section. Existing files become view-only too; an admin can allow downloads per file.
alter table public.resources add column if not exists allow_download boolean not null default false;
