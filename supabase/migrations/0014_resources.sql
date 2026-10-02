-- lockin. admin-uploaded notes & resources.
-- Files live in the PRIVATE storage bucket 'resources'. Nobody but the server (service role) can read or write the bucket:
-- students get a short-lived signed URL from /api/resources/[id] after the server checks their session and stream.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resources', 'resources', false, 20971520, array['application/pdf', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  course text not null check (course ~ '^[A-Z]{2,3}-[0-9]{3}$'),
  unit smallint not null check (unit between 1 and 12),
  topic text check (topic is null or topic ~ '^[0-9]{1,3}$'),
  kind text not null default 'notes' check (kind in ('notes', 'assignment', 'pyq-paper', 'slides', 'link', 'other')),
  title text not null check (char_length(title) between 1 and 140),
  description text not null default '' check (char_length(description) <= 500),
  file_path text check (file_path is null or char_length(file_path) between 1 and 400),
  file_name text check (file_name is null or char_length(file_name) between 1 and 200),
  size_bytes bigint check (size_bytes is null or size_bytes between 0 and 20971520),
  mime text check (mime is null or mime in ('application/pdf', 'image/png', 'image/jpeg')),
  external_url text check (external_url is null or (external_url ~* '^https?://' and char_length(external_url) <= 500)),
  hidden boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (file_path is not null or external_url is not null)
);
create index resources_course_unit on public.resources (course, unit, created_at desc);
alter table public.resources enable row level security;
create policy resources_select_visible on public.resources for select to authenticated using (not hidden);
revoke all on public.resources from anon, authenticated;
grant select on public.resources to authenticated;
grant all on public.resources to service_role;

-- each student's own "done / seen" ticks
create table public.resource_seen (
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);
alter table public.resource_seen enable row level security;
create policy resource_seen_select_own on public.resource_seen for select to authenticated using (user_id = auth.uid());
create policy resource_seen_insert_own on public.resource_seen for insert to authenticated with check (user_id = auth.uid());
create policy resource_seen_delete_own on public.resource_seen for delete to authenticated using (user_id = auth.uid());
revoke all on public.resource_seen from anon, authenticated;
grant select, insert, delete on public.resource_seen to authenticated;
grant all on public.resource_seen to service_role;
