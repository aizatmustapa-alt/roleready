alter table public.applications
  add column if not exists strengthen_count integer not null default 0;
