\set ON_ERROR_STOP on
create or replace function public.t_svc() returns void language plpgsql as $$ begin execute 'set local role service_role'; end $$;
grant execute on function public.t_svc() to service_role;
insert into auth.users(id,email) values
 ('00000000-0000-0000-0000-0000000000d1','d1@x.com'),('00000000-0000-0000-0000-0000000000d2','d2@x.com');

do $$
declare D1 uuid:='00000000-0000-0000-0000-0000000000d1'; D2 uuid:='00000000-0000-0000-0000-0000000000d2'; n int; s uuid; s2 uuid; i int; r jsonb; sid uuid;
begin
  -- saved lab setups: own rows only
  perform t_as(D1);
  insert into lab_setups (lab, name, params) values ('rlc', '  Resonance  ', '{"R":5,"f":159}') returning id into sid;
  perform t_ok((select user_id from lab_setups where id = sid) = D1, 'a setup is owned by the student who saved it');
  perform t_ok((select name from lab_setups where id = sid) = 'Resonance', 'setup name is trimmed');
  perform t_denied($q$insert into lab_setups (user_id, lab, name, params) values ('00000000-0000-0000-0000-0000000000d2','rlc','x','{}')$q$, 'cannot save a setup as someone else');
  perform t_denied($q$insert into lab_setups (lab, name, params) values ('../etc','x','{}')$q$, 'bad lab id rejected');
  perform t_denied($q$insert into lab_setups (lab, name, params) values ('rlc','   ','{}')$q$, 'blank name rejected');
  perform t_denied($q$insert into lab_setups (lab, name, params) values ('rlc','x','[1,2]')$q$, 'non-object params rejected');
  perform t_denied($q$insert into lab_setups (lab, name, params) values ('rlc','x', jsonb_build_object('a', repeat('x', 3000)))$q$, 'oversized params rejected');
  perform t_denied($q$update lab_setups set name = 'hacked'$q$, 'setups cannot be edited in place');
  perform t_reset();
  perform t_as(D2);
  perform t_ok((select count(*) from lab_setups) = 0, 'another student sees none of my setups');
  delete from lab_setups where id = sid; get diagnostics n = row_count;
  perform t_ok(n = 0, 'another student cannot delete my setup');
  perform t_reset();
  perform t_as(null);
  perform t_denied($q$select * from lab_setups$q$, 'signed-out visitors cannot read setups');
  perform t_reset();
  insert into lab_setups (user_id, lab, name, params) select D2, 'rlc', 'n' || g, '{}' from generate_series(1, 100) g;
  perform t_as(D2);
  perform t_denied($q$insert into lab_setups (lab, name, params) values ('rlc','one too many','{}')$q$, 'at most 100 saved setups');
  perform t_reset();
  perform t_as(D1);
  delete from lab_setups where id = sid; get diagnostics n = row_count;
  perform t_ok(n = 1, 'owner can delete a setup');
  perform t_reset();

  -- assignments: pay once per unit, ever
  perform t_svc();
  s := start_quiz_session(D1,'AHT-003',2,7,'assignment',null,10);
  for i in 0..9 loop perform record_answer(D1, s, i, to_jsonb(i), true); end loop;
  perform t_reset();
  update quiz_sessions set created_at = now() - interval '10 minutes' where id = s;
  perform t_svc();
  r := finish_quiz_session(D1, s);
  perform t_reset();
  perform t_ok((r->>'xp')::int = 50, 'a perfect assignment pays 4 per answer + 10 bonus');
  perform t_ok((select ref from xp_events where user_id = D1 and kind = 'assignment_completed') = 'AHT-003:2', 'assignment XP is keyed to the unit');
  perform t_svc();
  s2 := start_quiz_session(D1,'AHT-003',2,8,'assignment',null,10);
  for i in 0..9 loop perform record_answer(D1, s2, i, to_jsonb(i), true); end loop;
  perform t_reset();
  update quiz_sessions set created_at = now() - interval '10 minutes' where id = s2;
  perform t_svc();
  r := finish_quiz_session(D1, s2);
  perform t_reset();
  perform t_ok((r->>'xp')::int = 0 and not (r->>'replay')::boolean, 'retaking an assignment is graded but pays nothing');
  perform t_ok((select count(*) from xp_events where user_id = D1 and kind = 'assignment_completed') = 1, 'one assignment payout per unit');
  perform t_svc();
  s := start_quiz_session(D2,'AHT-003',3,9,'assignment',null,10);
  for i in 0..9 loop perform record_answer(D2, s, i, to_jsonb(i), i < 3); end loop;
  perform t_reset();
  update quiz_sessions set created_at = now() - interval '10 minutes' where id = s;
  perform t_svc();
  r := finish_quiz_session(D2, s);
  perform t_reset();
  perform t_ok((r->>'xp')::int = 0 and (r->>'correct')::int = 3, 'an assignment under 40% is graded but pays nothing');
  perform t_ok((select count(*) from xp_events where user_id = D2 and kind = 'assignment_completed') = 0, 'a failed assignment leaves the unit payout open');
  perform t_as(D1);
  perform t_denied($q$insert into xp_events (user_id, kind, ref, xp) values ('00000000-0000-0000-0000-0000000000d1','assignment_completed','AHT-003:5',50)$q$, 'students cannot write assignment XP');
  perform t_reset();
  delete from auth.users where id in (D1, D2);
  perform t_ok((select count(*) from lab_setups where user_id in (D1, D2)) = 0 and (select count(*) from quiz_sessions where user_id in (D1, D2)) = 0, 'account deletion removes saved setups and assignments');
  raise notice 'ALL LABS/ASSIGNMENTS DB TESTS PASSED';
end $$;
