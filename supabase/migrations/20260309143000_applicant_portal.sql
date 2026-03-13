-- Applicant portal schema for TalentMatch

create extension if not exists pgcrypto;

create table if not exists public.applicant_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  nickname text,
  degree_level text,
  research_interests text,
  member_since date default current_date,
  profile_picture_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  department text not null,
  location text not null,
  duration text not null,
  education_level text not null,
  compensation text not null check (compensation in ('paid', 'unpaid')),
  supervisor_name text not null,
  research_center text,
  tags text[] not null default '{}',
  requirements text,
  is_featured boolean not null default false,
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null default 'submitted' check (status in ('submitted', 'in_review', 'accepted', 'rejected')),
  cover_letter_text text,
  cover_letter_file_path text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (applicant_id, project_id)
);

create table if not exists public.applicant_settings (
  applicant_id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'English',
  timezone text not null default 'UTC',
  email_notifications boolean not null default true,
  status_updates boolean not null default true,
  new_opportunities boolean not null default true,
  marketing_emails boolean not null default false,
  profile_visibility text not null default 'public' check (profile_visibility in ('public', 'limited', 'private')),
  show_email_address boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_department_idx on public.projects (department);
create index if not exists projects_location_idx on public.projects (location);
create index if not exists applications_applicant_id_idx on public.applications (applicant_id);
create index if not exists applications_project_id_idx on public.applications (project_id);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_applicant_profiles_updated_at on public.applicant_profiles;
create trigger set_applicant_profiles_updated_at
before update on public.applicant_profiles
for each row execute function public.handle_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.handle_updated_at();

drop trigger if exists set_applications_updated_at on public.applications;
create trigger set_applications_updated_at
before update on public.applications
for each row execute function public.handle_updated_at();

drop trigger if exists set_applicant_settings_updated_at on public.applicant_settings;
create trigger set_applicant_settings_updated_at
before update on public.applicant_settings
for each row execute function public.handle_updated_at();

alter table public.applicant_profiles enable row level security;
alter table public.projects enable row level security;
alter table public.applications enable row level security;
alter table public.applicant_settings enable row level security;

-- Profiles: applicant can read/write own profile.
drop policy if exists "profiles_select_own" on public.applicant_profiles;
create policy "profiles_select_own"
on public.applicant_profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.applicant_profiles;
create policy "profiles_insert_own"
on public.applicant_profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.applicant_profiles;
create policy "profiles_update_own"
on public.applicant_profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Projects are readable by authenticated users.
drop policy if exists "projects_select_authenticated" on public.projects;
create policy "projects_select_authenticated"
on public.projects
for select
using (auth.role() = 'authenticated');

-- Applications: applicant can read/create/delete their own.
drop policy if exists "applications_select_own" on public.applications;
create policy "applications_select_own"
on public.applications
for select
using (auth.uid() = applicant_id);

drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_insert_own"
on public.applications
for insert
with check (auth.uid() = applicant_id);

drop policy if exists "applications_update_own" on public.applications;
create policy "applications_update_own"
on public.applications
for update
using (auth.uid() = applicant_id)
with check (auth.uid() = applicant_id);

drop policy if exists "applications_delete_own" on public.applications;
create policy "applications_delete_own"
on public.applications
for delete
using (auth.uid() = applicant_id);

-- Settings: applicant can read/write own settings.
drop policy if exists "settings_select_own" on public.applicant_settings;
create policy "settings_select_own"
on public.applicant_settings
for select
using (auth.uid() = applicant_id);

drop policy if exists "settings_insert_own" on public.applicant_settings;
create policy "settings_insert_own"
on public.applicant_settings
for insert
with check (auth.uid() = applicant_id);

drop policy if exists "settings_update_own" on public.applicant_settings;
create policy "settings_update_own"
on public.applicant_settings
for update
using (auth.uid() = applicant_id)
with check (auth.uid() = applicant_id);

-- Optional storage bucket for application attachments.
insert into storage.buckets (id, name, public)
values ('application-files', 'application-files', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload/view their own files.
drop policy if exists "attachments_select_own" on storage.objects;
create policy "attachments_select_own"
on storage.objects
for select
using (bucket_id = 'application-files' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "attachments_insert_own" on storage.objects;
create policy "attachments_insert_own"
on storage.objects
for insert
with check (bucket_id = 'application-files' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "attachments_delete_own" on storage.objects;
create policy "attachments_delete_own"
on storage.objects
for delete
using (bucket_id = 'application-files' and auth.uid()::text = (storage.foldername(name))[1]);
