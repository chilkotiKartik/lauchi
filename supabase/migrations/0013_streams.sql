-- The app serves CSE, AIML and BCA only. NOT VALID: rows from older branches are not re-checked, new/updated rows must use the three.
alter table public.profiles drop constraint if exists profiles_branch_check;
alter table public.profiles add constraint profiles_branch_check
  check (branch in ('CSE','AIML','BCA')) not valid;
