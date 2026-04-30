-- Drop unused supervisor columns now that no app or SQL object references them.
ALTER TABLE public.supervisors
  DROP COLUMN IF EXISTS teachable_points,
  DROP COLUMN IF EXISTS profile_data;
