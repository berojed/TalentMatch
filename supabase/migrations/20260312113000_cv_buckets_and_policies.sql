-- CV storage buckets and policies for applicants/supervisors.

insert into storage.buckets (id, name, public)
values ('applicants_cvs', 'applicants_cvs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('supervisors_cvs', 'supervisors_cvs', false)
on conflict (id) do nothing;

-- Applicants can manage their own CV object path: applicants_cvs/<auth.uid()>/*
drop policy if exists "applicants_cvs_select_own" on storage.objects;
create policy "applicants_cvs_select_own"
on storage.objects
for select
using (
  bucket_id = 'applicants_cvs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "applicants_cvs_insert_own" on storage.objects;
create policy "applicants_cvs_insert_own"
on storage.objects
for insert
with check (
  bucket_id = 'applicants_cvs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "applicants_cvs_update_own" on storage.objects;
create policy "applicants_cvs_update_own"
on storage.objects
for update
using (
  bucket_id = 'applicants_cvs'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'applicants_cvs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "applicants_cvs_delete_own" on storage.objects;
create policy "applicants_cvs_delete_own"
on storage.objects
for delete
using (
  bucket_id = 'applicants_cvs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Supervisors can read applicant CVs for review.
drop policy if exists "applicants_cvs_select_supervisors" on storage.objects;
create policy "applicants_cvs_select_supervisors"
on storage.objects
for select
using (
  bucket_id = 'applicants_cvs'
  and exists (
    select 1
    from public.users u
    where u.user_id = auth.uid()
      and u.role_id = 2
  )
);

-- Supervisors can manage their own CV object path: supervisors_cvs/<auth.uid()>/*
drop policy if exists "supervisors_cvs_select_own" on storage.objects;
create policy "supervisors_cvs_select_own"
on storage.objects
for select
using (
  bucket_id = 'supervisors_cvs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "supervisors_cvs_insert_own" on storage.objects;
create policy "supervisors_cvs_insert_own"
on storage.objects
for insert
with check (
  bucket_id = 'supervisors_cvs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "supervisors_cvs_update_own" on storage.objects;
create policy "supervisors_cvs_update_own"
on storage.objects
for update
using (
  bucket_id = 'supervisors_cvs'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'supervisors_cvs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "supervisors_cvs_delete_own" on storage.objects;
create policy "supervisors_cvs_delete_own"
on storage.objects
for delete
using (
  bucket_id = 'supervisors_cvs'
  and auth.uid()::text = (storage.foldername(name))[1]
);
