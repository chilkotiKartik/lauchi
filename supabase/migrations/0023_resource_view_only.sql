-- lockin. View-only notes: an admin decides per file whether students may download it. Default is view-only, so a
-- PDF uploaded for reading is shown inside the app (streamed through the server, never as a storage link) and cannot be
-- downloaded from the Notes section. Existing files become view-only too; an admin can allow downloads per file.
alter table public.resources add column if not exists allow_download boolean not null default false;
