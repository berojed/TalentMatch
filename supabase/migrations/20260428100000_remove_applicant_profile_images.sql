-- Drop applicant profile picture column.
ALTER TABLE public.applicants
  DROP COLUMN IF EXISTS profile_image_url;

-- Drop applicant_avatars storage policies. Bucket and existing objects intentionally retained.
DROP POLICY IF EXISTS "Owner can upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Owner can update avatar" ON storage.objects;
DROP POLICY IF EXISTS "Owner can delete avatar" ON storage.objects;
