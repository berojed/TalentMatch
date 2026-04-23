-- Add profile image URL column to applicants
ALTER TABLE public.applicants
  ADD COLUMN IF NOT EXISTS profile_image_url text;

-- Create storage bucket for applicant avatars (public so images are directly accessible)
INSERT INTO storage.buckets (id, name, public)
VALUES ('applicant_avatars', 'applicant_avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Owner can upload their own avatar
CREATE POLICY "Owner can upload avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'applicant_avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Anyone authenticated can view avatars (profile pictures are not sensitive)
CREATE POLICY "Authenticated can view avatars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'applicant_avatars');

-- Owner can update their own avatar
CREATE POLICY "Owner can update avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'applicant_avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Owner can delete their own avatar
CREATE POLICY "Owner can delete avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'applicant_avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
