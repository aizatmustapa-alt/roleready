alter table public.applications
  add column if not exists notes text,
  add column if not exists hiring_manager text,
  add column if not exists location_type text,
  add column if not exists role_summary text,
  add column if not exists other_notes text;
