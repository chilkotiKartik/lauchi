\set ON_ERROR_STOP on
create or replace function public.t_as(uid uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', coalesce(uid::text,''), true); perform set_config('request.jwt.claims', json_build_object('sub', uid)::text, true); execute 'set local role ' || case when uid is null then 'anon' else 'authenticated' end; end $$;
create or replace function public.t_reset() returns void language plpgsql as $$ begin execute 'reset role'; perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','',true); end $$;
create or replace function public.t_ok(c boolean, msg text) returns void language plpgsql as $$ begin if not c then raise exception 'FAIL: %', msg; end if; raise notice 'pass: %', msg; end $$;
create or replace function public.t_denied(stmt text, msg text) returns void language plpgsql as $$
begin
  begin execute stmt; exception when others then raise notice 'pass: % (%)', msg, left(sqlerrm, 60); return; end;
  raise exception 'FAIL (was allowed): %', msg;
end $$;
grant execute on function public.t_as(uuid), public.t_reset(), public.t_ok(boolean,text), public.t_denied(text,text) to anon, authenticated;

insert into auth.users(id,email) values
 ('00000000-0000-0000-0000-00000000000a','a@x.com'),('00000000-0000-0000-0000-00000000000b','b@x.com');

do $$
declare A uuid:='00000000-0000-0000-0000-00000000000a'; B uuid:='00000000-0000-0000-0000-00000000000b'; n int; g int; j jsonb;
begin
  perform t_ok((select count(*) from profiles)=2, 'profile created on sign-up');

  -- profiles
  perform t_as(A);
  perform t_ok((select count(*) from profiles)=1, 'student sees only own profile');
  update profiles set name='Alice', branch='CSE', year=1, semester=1, onboarded_at=now() where id=A;
  perform t_ok((select name from profiles where id=A)='Alice', 'student can complete own onboarding');
  update profiles set name='Hacked' where id=B; get diagnostics n = row_count;
  perform t_ok(n=0, 'student cannot update another profile (0 rows)');
  perform t_denied($q$update profiles set email='evil@x.com' where id='00000000-0000-0000-0000-00000000000a'$q$, 'email column is not writable');
  perform t_denied($q$update profiles set id=gen_random_uuid() where id='00000000-0000-0000-0000-00000000000a'$q$, 'id column is not writable');
  perform t_denied($q$insert into profiles(id,name) values (gen_random_uuid(),'x')$q$, 'client cannot insert profiles');
  perform t_denied($q$delete from profiles where id='00000000-0000-0000-0000-00000000000a'$q$, 'client cannot delete profiles');
  perform t_denied($q$update profiles set timezone='Mars/Base' where id='00000000-0000-0000-0000-00000000000a'$q$, 'invalid timezone rejected');
  update profiles set timezone='Asia/Kolkata' where id=A;
  perform t_ok((select timezone from profiles where id=A)='Asia/Kolkata', 'IANA timezone Asia/Kolkata is accepted');
  perform t_denied($q$update profiles set timezone='IST' where id='00000000-0000-0000-0000-00000000000a'$q$, 'timezone abbreviations are rejected');
  perform t_denied($q$update profiles set year=2 where id='00000000-0000-0000-0000-00000000000a'$q$, 'unsupported year rejected');
  perform t_denied($q$update profiles set daily_goal_xp=100000 where id='00000000-0000-0000-0000-00000000000a'$q$, 'absurd daily goal rejected');
  perform t_denied($q$update profiles set name=repeat('x',80) where id='00000000-0000-0000-0000-00000000000a'$q$, 'overlong name rejected');
  perform t_reset();
  perform t_denied($q$update profiles set name='', onboarded_at=now() where id='00000000-0000-0000-0000-00000000000b'$q$, 'onboarding needs a name and branch');

  perform t_as(null);
  perform t_denied($q$select * from profiles$q$, 'anonymous cannot read profiles');
  perform t_denied($q$select dashboard_stats()$q$, 'anonymous cannot call dashboard_stats');
  perform t_reset();

  -- XP ledger: clients can never write it
  perform t_as(A);
  perform t_denied($q$insert into xp_events(user_id,kind,ref,xp) values ('00000000-0000-0000-0000-00000000000a','quiz_completed','x',100)$q$, 'client cannot insert XP');
  perform t_denied($q$update xp_events set xp=200$q$, 'client cannot update XP');
  perform t_denied($q$delete from xp_events$q$, 'client cannot delete XP');
  perform t_denied($q$select award_xp('00000000-0000-0000-0000-00000000000a','quiz_completed','y',50)$q$, 'client cannot call award_xp');
  perform t_reset();

  -- trusted awarding
  g := award_xp(A,'quiz_completed','attempt-1',40);
  perform t_ok(g=40, 'trusted award pays once');
  perform t_ok(award_xp(A,'quiz_completed','attempt-1',40)=0, 'replay of the same attempt pays nothing');
  perform t_ok(award_xp(A,'quiz_completed','attempt-2',40)=40, 'a different attempt pays');
  perform t_denied($q$select award_xp('00000000-0000-0000-0000-00000000000a','bogus_kind','z',10)$q$, 'unknown event kind rejected');
  perform t_denied($q$select award_xp('00000000-0000-0000-0000-00000000000a','quiz_completed','big',500)$q$, 'single award above 200 rejected');
  for n in 1..12 loop perform award_xp(A,'mock_completed','m'||n,150); end loop;
  perform t_ok((select sum(xp) from xp_events where user_id=A and created_at::date=current_date) <= 1500, 'daily XP cap holds (1500)');

  perform t_as(B);
  perform t_ok((select count(*) from xp_events)=0, 'student cannot see another student''s XP');
  j := dashboard_stats();
  perform t_ok((j->>'total_xp')::int=0 and (j->>'streak')::int=0, 'new student has 0 XP and no streak');
  perform t_reset();

  -- streak in the student's own timezone
  update profiles set timezone='Asia/Kolkata' where id=B;
  insert into xp_events(user_id,kind,ref,xp,created_at) values
    (B,'quiz_completed','d0',10, now()), (B,'quiz_completed','d1',10, now()-interval '1 day'),
    (B,'quiz_completed','d2',10, now()-interval '2 days'), (B,'quiz_completed','d4',10, now()-interval '4 days');
  perform t_as(B);
  j := dashboard_stats();
  perform t_ok((j->>'streak')::int=3, 'streak counts 3 consecutive days and stops at the gap');
  perform t_ok((j->>'total_xp')::int=40, 'total XP is the sum of ledger events');
  perform t_reset();
  delete from xp_events where user_id=B and ref='d0';
  perform t_as(B);
  perform t_ok((dashboard_stats()->>'streak')::int=2, 'streak survives until the day ends');
  perform t_reset();

  -- consent records
  perform t_as(A);
  perform record_consent('2026-09'); perform record_consent('2026-09');
  perform t_ok((select count(*) from consents)=1, 'consent recorded once per policy version');
  perform t_denied($q$insert into consents(user_id,policy_version) values ('00000000-0000-0000-0000-00000000000b','x')$q$, 'client cannot write consents directly');
  perform t_as(B);
  perform t_ok((select count(*) from consents)=0, 'student cannot see another student''s consent');
  perform t_reset();
  perform t_as(null);
  perform t_denied($q$select record_consent('2026-09')$q$, 'anonymous cannot record consent');
  perform t_reset();

  -- account deletion cascades
  delete from auth.users where id=B;
  perform t_ok((select count(*) from profiles where id=B)=0 and (select count(*) from xp_events where user_id=B)=0, 'deleting the account removes profile and XP');
  raise notice 'ALL CORE DB TESTS PASSED';
end $$;
