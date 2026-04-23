-- Add is_favorited to applications for supervisor bookmarking
alter table public.applications
  add column if not exists is_favorited boolean not null default false;

create index if not exists idx_applications_is_favorited
  on public.applications (is_favorited)
  where is_favorited = true;
