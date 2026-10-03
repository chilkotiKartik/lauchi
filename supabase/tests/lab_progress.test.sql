\set ON_ERROR_STOP on
-- Lab progress: written only by the server, XP paid once per lab and kind, best score kept, rows private to the student.
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000000c7','lp1@x.com'),('00000000-0000-0000-0000-0000000000c8','lp2@x.com');

do $$
declare A uuid := '00000000-0000-0000-0000-0000000000c7'; r jsonb;
begin
  perform t_as(A);
  perform t_denied($q$select record_lab('00000000-0000-0000-0000-0000000000c7', 'rlc', 'tasks', 100)$q$, 'a student cannot record their own lab result directly');
  perform t_denied($q$insert into lab_progress(user_id, lab, kind, best) values ('00000000-0000-0000-0000-0000000000c7', 'rlc', 'tasks', 100)$q$, 'lab progress cannot be written by the client');
  perform t_reset();

  r := record_lab(A, 'rlc', 'tasks', 60);
  perform t_ok((r->>'xp')::int = 11 and (r->>'first')::boolean, 'first finish pays 5 + score/10 XP');
  r := record_lab(A, 'rlc', 'tasks', 100);
  perform t_ok((r->>'xp')::int = 0, 'replaying a lab never pays twice');
  perform t_ok((select best from lab_progress where user_id = A and lab = 'rlc' and kind = 'tasks') = 100, 'best score is kept');
  r := record_lab(A, 'rlc', 'tasks', 20);
  perform t_ok((select best from lab_progress where user_id = A and lab = 'rlc') = 100 and (select attempts from lab_progress where user_id = A and lab = 'rlc') = 3, 'a lower score does not lower the best; attempts count');
  r := record_lab(A, 'rlc', 'experiment', 80);
  perform t_ok((r->>'xp')::int = 22, 'the guided experiment pays separately (10 + 15 × score)');
  perform t_ok((select count(*) from xp_events where user_id = A and ref like 'lab:%') = 2, 'one XP row per lab and kind');
  begin perform record_lab(A, '../x', 'tasks', 50); perform t_ok(false, 'bad lab id rejected'); exception when raise_exception then perform t_ok(true, 'bad lab id rejected'); end;

  perform t_as(A);
  perform t_ok((select count(*) from lab_progress) = 2, 'student sees their own lab progress');
  perform t_reset();
  perform t_as('00000000-0000-0000-0000-0000000000c8');
  perform t_ok((select count(*) from lab_progress) = 0, 'another student sees none of it');
  perform t_reset();
end $$;
