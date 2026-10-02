\set ON_ERROR_STOP on
create or replace function public.t_svc() returns void language plpgsql as $$ begin execute 'set local role service_role'; end $$;
grant execute on function public.t_svc() to service_role;

insert into auth.users(id,email) values
 ('00000000-0000-0000-0000-0000000000a1','qa@x.com'),('00000000-0000-0000-0000-0000000000b1','qb@x.com');

do $$
declare A uuid:='00000000-0000-0000-0000-0000000000a1'; B uuid:='00000000-0000-0000-0000-0000000000b1';
  s uuid; s2 uuid; s3 uuid; r jsonb; i int; ok boolean;
begin
  -- clients cannot touch the write path
  perform t_as(A);
  perform t_denied($q$select start_quiz_session('00000000-0000-0000-0000-0000000000a1','AHT-003',1,7,'practice',null,5)$q$, 'client cannot start a quiz session');
  perform t_denied($q$insert into quiz_sessions(user_id,course,unit,seed,kind,total) values ('00000000-0000-0000-0000-0000000000a1','AHT-003',1,7,'practice',5)$q$, 'client cannot insert sessions');
  perform t_denied($q$insert into topic_progress(user_id,topic_key,best_score) values ('00000000-0000-0000-0000-0000000000a1','AHT-003:1:1',100)$q$, 'client cannot write topic progress');
  perform t_denied($q$select finish_quiz_session('00000000-0000-0000-0000-0000000000a1', gen_random_uuid())$q$, 'client cannot finish a session');
  perform t_denied($q$select record_answer('00000000-0000-0000-0000-0000000000a1', gen_random_uuid(), 0, '1', true)$q$, 'client cannot record answers');
  perform t_reset();
  perform t_as(null);
  perform t_denied($q$select * from quiz_sessions$q$, 'anonymous cannot read sessions');
  perform t_denied($q$select * from topic_progress$q$, 'anonymous cannot read progress');
  perform t_reset();

  -- a topic quiz, done properly
  perform t_svc();
  s := start_quiz_session(A,'AHT-003',1,424242,'topic','AHT-003:1:1',5);
  perform t_reset();
  perform t_as(A);
  perform t_ok((select count(*) from quiz_sessions where id=s)=1, 'student can read own session');
  perform t_denied($q$select seed from quiz_sessions$q$, 'seed column is hidden from the client');
  perform t_denied($q$select answers from quiz_sessions$q$, 'answers column is hidden from the client');
  perform t_reset();
  perform t_as(B);
  perform t_ok((select count(*) from quiz_sessions)=0, 'another student cannot see the session');
  perform t_reset();

  perform t_svc();
  perform t_denied(format($q$select finish_quiz_session('00000000-0000-0000-0000-0000000000a1','%s')$q$, s), 'cannot finish with no answers');
  for i in 0..4 loop perform record_answer(A, s, i, to_jsonb(i), true); end loop;
  ok := record_answer(A, s, 0, '99', false);
  perform t_ok(ok = false, 'a second answer to the same question is ignored (first wins)');
  perform t_denied(format($q$select record_answer('00000000-0000-0000-0000-0000000000a1','%s',5,'1',true)$q$, s), 'question index out of range rejected');
  perform t_denied(format($q$select record_answer('00000000-0000-0000-0000-0000000000b1','%s',0,'1',true)$q$, s), 'another student cannot answer my session');
  perform t_denied(format($q$select finish_quiz_session('00000000-0000-0000-0000-0000000000a1','%s')$q$, s), 'finishing instantly is refused (anti-farming)');
  perform t_reset();
  update quiz_sessions set created_at = now() - interval '5 minutes' where id = s;
  perform t_svc();
  perform t_denied(format($q$select finish_quiz_session('00000000-0000-0000-0000-0000000000b1','%s')$q$, s), 'another student cannot finish my session');
  r := finish_quiz_session(A, s);
  perform t_ok((r->>'correct')::int=5 and (r->>'xp')::int=45 and (r->>'topic_completed')::boolean, 'perfect topic quiz pays 15+10 quiz XP and 20 topic XP');
  r := finish_quiz_session(A, s);
  perform t_ok((r->>'xp')::int=0 and (r->>'replay')::boolean, 'replaying finish pays nothing');
  perform t_denied(format($q$select record_answer('00000000-0000-0000-0000-0000000000a1','%s',1,'1',true)$q$, s), 'cannot change answers after finishing');
  perform t_reset();
  perform t_as(A);
  perform t_ok((select count(*) from topic_progress where topic_key='AHT-003:1:1')=1, 'topic is marked done');
  perform t_ok((dashboard_stats()->>'total_xp')::int=45, 'dashboard shows the trusted XP');
  perform t_reset();

  -- passing again does not pay the topic bonus twice
  perform t_svc();
  s2 := start_quiz_session(A,'AHT-003',1,5,'topic','AHT-003:1:1',5);
  for i in 0..4 loop perform record_answer(A, s2, i, '1', true); end loop;
  perform t_reset();
  update quiz_sessions set created_at = now() - interval '5 minutes' where id = s2;
  perform t_svc();
  r := finish_quiz_session(A, s2);
  perform t_ok((r->>'topic_completed')::boolean = false and (r->>'xp')::int=25, 'topic bonus is paid once; the quiz itself still pays');
  perform t_reset();

  -- a failing attempt does not complete a topic
  perform t_svc();
  s3 := start_quiz_session(B,'AHT-003',2,9,'topic','AHT-003:2:1',5);
  for i in 0..4 loop perform record_answer(B, s3, i, '1', i < 2); end loop;
  perform t_reset();
  update quiz_sessions set created_at = now() - interval '5 minutes' where id = s3;
  perform t_svc();
  r := finish_quiz_session(B, s3);
  perform t_ok((r->>'correct')::int=2 and not (r->>'topic_completed')::boolean and not (r->>'passed')::boolean, '2 of 5 does not complete the topic');
  perform t_reset();
  perform t_ok((select count(*) from topic_progress where user_id=B)=0, 'no progress row for a failed attempt');

  -- validation and limits
  perform t_svc();
  perform t_denied($q$select start_quiz_session('00000000-0000-0000-0000-0000000000b1','bad code',1,1,'practice',null,5)$q$, 'bad course code rejected');
  perform t_denied($q$select start_quiz_session('00000000-0000-0000-0000-0000000000b1','AHT-003',1,1,'practice','AHT-003:1:1',5)$q$, 'practice quiz must not carry a topic');
  perform t_denied($q$select start_quiz_session('00000000-0000-0000-0000-0000000000b1','AHT-003',1,1,'topic',null,5)$q$, 'topic quiz needs a topic');
  perform t_denied($q$select start_quiz_session('00000000-0000-0000-0000-0000000000b1','AHT-003',1,1,'topic','nonsense',5)$q$, 'bad topic key rejected');
  perform t_denied($q$select start_quiz_session('00000000-0000-0000-0000-0000000000b1','AHT-003',1,1,'practice',null,500)$q$, 'oversized quiz rejected');
  perform t_denied($q$select start_quiz_session(gen_random_uuid(),'AHT-003',1,1,'practice',null,5)$q$, 'unknown user rejected');
  for i in 1..119 loop perform start_quiz_session(B,'AHT-003',1,i,'practice',null,5); end loop;
  perform t_denied($q$select start_quiz_session('00000000-0000-0000-0000-0000000000b1','AHT-003',1,1,'practice',null,5)$q$, 'daily quiz limit holds');
  perform t_reset();

  delete from auth.users where id in (A,B);
  perform t_ok((select count(*) from quiz_sessions)=0 and (select count(*) from topic_progress)=0, 'account deletion removes sessions and progress');
  raise notice 'ALL LEARNING DB TESTS PASSED';
end $$;
