-- Add structured profile_data JSON columns for applicants and supervisors.
-- Backward-safe additive migration: existing CV columns, documents rows, and storage buckets are untouched.

ALTER TABLE public.applicants
  ADD COLUMN IF NOT EXISTS profile_data jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.supervisors
  ADD COLUMN IF NOT EXISTS profile_data jsonb NOT NULL DEFAULT '{}'::jsonb;
