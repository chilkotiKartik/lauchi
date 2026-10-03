\set ON_ERROR_STOP on
-- Sunday Quest: clients can read their own summary columns only; grading and XP go through the service role.
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000000d1','sun@x.com');

do $$
declare A uuid := '00000000-0000-0000-0000-0000000000d1'; sun date := (now() at time zone 'Asia/Kolkata')::date;
begin
  sun := sun + ((7 - extract(isodow from sun)::int) % 7); -- this week's Sunday
  insert into sunday_quests(user_id, day, items, units) values (A, sun, '[{"c":"AHT-001","u":1,"t":0,"s":1}]', '[]');
  perform t_as(A);
  perform t_denied($q$select sunday_answer('00000000-0000-0000-0000-0000000000d1', current_date, 0, '1', true)$q$, 'client cannot grade its own Sunday Quest');
  perform t_denied($q$select items from sunday_quests$q$, 'quest items (question seeds) are hidden from the client');
  perform t_denied($q$select answers from sunday_quests$q$, 'quest answers are hidden from the client');
  perform t_ok((select count(*) from sunday_quests) = 1, 'student sees their own quest summary');
  perform t_reset();
  perform t_denied($q$insert into sunday_quests(user_id, day, items) values ('00000000-0000-0000-0000-0000000000d1', date '2026-10-06', '[{"c":"x"}]')$q$, 'only Sundays can hold a quest');
end $$;
