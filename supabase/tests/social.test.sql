\set ON_ERROR_STOP on
insert into auth.users(id,email) values
 ('00000000-0000-0000-0000-0000000000e1','e1@x.com'),('00000000-0000-0000-0000-0000000000e2','e2@x.com'),('00000000-0000-0000-0000-0000000000e3','e3@x.com');

do $$
declare E1 uuid:='00000000-0000-0000-0000-0000000000e1'; E2 uuid:='00000000-0000-0000-0000-0000000000e2'; E3 uuid:='00000000-0000-0000-0000-0000000000e3';
begin
  update profiles set name = 'Asha Rawat', league_opt_in = true where id = E1;
  update profiles set name = 'Bikram Singh Negi', league_opt_in = true where id = E2;
  update profiles set name = 'Chetna Joshi', league_opt_in = false where id = E3;
  insert into xp_events (user_id, kind, ref, xp) values (E1, 'quiz_completed', 'w1', 30), (E2, 'quiz_completed', 'w2', 50), (E3, 'quiz_completed', 'w3', 90);
  insert into xp_events (user_id, kind, ref, xp, created_at) values (E1, 'quiz_completed', 'old', 100, now() - interval '20 days');

  -- league
  perform t_as(E1);
  perform t_ok((select count(*) from league_board(20)) = 2, 'the board lists only students who joined (opted-out student hidden)');
  perform t_ok((select display from league_board(20) where rank = 1) = 'Bikram', 'ranked by this week XP, shown by first name only');
  perform t_ok((select xp from league_board(20) where me) = 30, 'old XP from earlier weeks is not counted');
  perform t_ok((select count(*) from league_board(20) where me) = 1, 'the caller is marked');
  perform t_ok(not exists (select 1 from league_board(20) where display like '%Rawat%' or display like '%Negi%'), 'last names are never exposed');
  perform t_reset();
  perform t_as(E3);
  perform t_ok((select count(*) from league_board(20)) = 2, 'a student who has not joined sees the board but is not on it');
  perform t_ok((select count(*) from league_board(20) where me) = 0, 'and is not marked');
  perform t_reset();
  perform t_as(null);
  perform t_denied($q$select * from league_board(20)$q$, 'signed-out visitors cannot read the league');
  perform t_reset();
end $$;

do $$
declare E1 uuid:='00000000-0000-0000-0000-0000000000e1'; E2 uuid:='00000000-0000-0000-0000-0000000000e2'; ok boolean; cnt int;
begin
  perform t_as(E1);
  update profiles set league_opt_in = false where id = E1; get diagnostics cnt = row_count;
  perform t_ok(cnt = 1, 'a student can leave the league');
  perform t_ok((select count(*) from league_board(20) where me) = 0, 'and then disappears from the board');
  update profiles set league_opt_in = true where id = E2; get diagnostics cnt = row_count;
  perform t_ok(cnt = 0, 'a student cannot opt someone else in');
  perform t_reset();

  -- AI usage cap
  perform t_as(E1);
  perform t_denied($q$select bump_ai_usage('00000000-0000-0000-0000-0000000000e1', 5)$q$, 'clients cannot call the usage counter');
  perform t_denied($q$select * from ai_usage$q$, 'clients cannot read usage rows');
  perform t_reset();
  perform t_svc();
  ok := bump_ai_usage(E1, 2); perform t_ok(ok, 'first request allowed');
  ok := bump_ai_usage(E1, 2); perform t_ok(ok, 'second request allowed');
  ok := bump_ai_usage(E1, 2); perform t_ok(not ok, 'third request refused at a limit of two');
  perform t_reset();
  perform t_ok((select u.n from ai_usage u where u.user_id = E1) = 2, 'a refused request is not counted');
  perform t_ok(bump_ai_usage(E2, 2), 'another student has their own allowance');
  raise notice 'ALL SOCIAL DB TESTS PASSED';
end $$;
