\set ON_ERROR_STOP on
create or replace function public.t_svc() returns void language plpgsql as $$ begin execute 'set local role service_role'; end $$;
grant execute on function public.t_svc() to service_role;
insert into auth.users(id,email) values
 ('00000000-0000-0000-0000-0000000000c1','c1@x.com'),('00000000-0000-0000-0000-0000000000c2','c2@x.com');

do $$
declare C1 uuid:='00000000-0000-0000-0000-0000000000c1'; C2 uuid:='00000000-0000-0000-0000-0000000000c2'; n int; s uuid; i int; r jsonb;
begin
  perform t_as(C1);
  update profiles set exam_date = date '2026-12-15', study_hours = 3 where id = C1;
  perform t_ok((select exam_date from profiles where id = C1) = date '2026-12-15', 'student can set own exam date');
  update profiles set exam_date = date '2027-01-01' where id = C2; get diagnostics n = row_count;
  perform t_ok(n = 0, 'student cannot set another student''s exam date');
  perform t_denied($q$update profiles set exam_date = date '1999-01-01' where id = '00000000-0000-0000-0000-0000000000c1'$q$, 'absurd past exam date rejected');
  perform t_denied($q$update profiles set study_hours = 0 where id = '00000000-0000-0000-0000-0000000000c1'$q$, 'zero study hours rejected');
  perform t_denied($q$update profiles set study_hours = 20 where id = '00000000-0000-0000-0000-0000000000c1'$q$, 'more than 12 study hours rejected');
  update profiles set exam_date = null where id = C1;
  perform t_ok((select exam_date from profiles where id = C1) is null, 'exam date can be cleared');
  perform t_reset();

  -- mock test: pays once, under its own XP kind
  perform t_svc();
  s := start_quiz_session(C1,'AHT-003',1,99,'mock',null,20);
  for i in 0..19 loop perform record_answer(C1, s, i, to_jsonb(i), true); end loop;
  perform t_reset();
  update quiz_sessions set created_at = now() - interval '10 minutes' where id = s;
  perform t_svc();
  r := finish_quiz_session(C1, s);
  perform t_reset();
  perform t_ok((r->>'xp')::int = 70, 'a perfect 20-question mock pays 3 per answer + 10 bonus');
  perform t_ok((select count(*) from xp_events where user_id = C1 and kind = 'mock_completed' and ref = s::text) = 1, 'mock pays under mock_completed');
  perform t_ok((select count(*) from xp_events where user_id = C1 and kind = 'quiz_completed') = 0, 'a mock does not also pay as a practice quiz');
  perform t_svc();
  r := finish_quiz_session(C1, s);
  perform t_reset();
  perform t_ok((r->>'xp')::int = 0 and (r->>'replay')::boolean, 'finishing a mock again pays nothing');
  perform t_svc();
  perform t_denied($q$select start_quiz_session('00000000-0000-0000-0000-0000000000c1','AHT-003',1,1,'exam',null,5)$q$, 'unknown session kind rejected');
  perform t_reset();
  raise notice 'ALL PLANNING DB TESTS PASSED';
end $$;
