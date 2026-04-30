-- Add explicit supervisor profile columns and backfill from profile_data.
-- Backward-safe additive migration. profile_data and teachable_points dropped in a follow-up.

ALTER TABLE public.supervisors
  ADD COLUMN IF NOT EXISTS lab_name              text,
  ADD COLUMN IF NOT EXISTS research_areas        text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS years_experience      integer,
  ADD COLUMN IF NOT EXISTS short_bio             text,
  ADD COLUMN IF NOT EXISTS past_projects         text,
  ADD COLUMN IF NOT EXISTS key_achievements      text,
  ADD COLUMN IF NOT EXISTS current_project_info  text,
  ADD COLUMN IF NOT EXISTS applicant_expectations text;

-- Backfill scalar fields from profile_data subtrees.
UPDATE public.supervisors
SET lab_name = NULLIF(profile_data->'lab_info'->>'lab_name', '')
WHERE lab_name IS NULL
  AND profile_data ? 'lab_info'
  AND COALESCE(profile_data->'lab_info'->>'lab_name', '') <> '';

UPDATE public.supervisors
SET institution = profile_data->'lab_info'->>'institution'
WHERE COALESCE(institution, '') = ''
  AND profile_data ? 'lab_info'
  AND COALESCE(profile_data->'lab_info'->>'institution', '') <> '';

UPDATE public.supervisors
SET department = profile_data->'lab_info'->>'department'
WHERE COALESCE(department, '') = ''
  AND profile_data ? 'lab_info'
  AND COALESCE(profile_data->'lab_info'->>'department', '') <> '';

UPDATE public.supervisors
SET research_areas = COALESCE(
  (
    SELECT array_agg(value::text)
    FROM jsonb_array_elements_text(profile_data->'research_areas') AS t(value)
    WHERE NULLIF(value, '') IS NOT NULL
  ),
  '{}'::text[]
)
WHERE research_areas = '{}'::text[]
  AND jsonb_typeof(profile_data->'research_areas') = 'array';

UPDATE public.supervisors
SET years_experience = (profile_data->'experience'->>'years')::integer
WHERE years_experience IS NULL
  AND profile_data ? 'experience'
  AND (profile_data->'experience'->>'years') ~ '^[0-9]+$';

UPDATE public.supervisors
SET short_bio = NULLIF(profile_data->'experience'->>'short_bio', '')
WHERE short_bio IS NULL
  AND profile_data ? 'experience'
  AND COALESCE(profile_data->'experience'->>'short_bio', '') <> '';

UPDATE public.supervisors
SET past_projects = NULLIF(profile_data->'project_history'->>'past_projects', '')
WHERE past_projects IS NULL
  AND profile_data ? 'project_history'
  AND COALESCE(profile_data->'project_history'->>'past_projects', '') <> '';

UPDATE public.supervisors
SET key_achievements = NULLIF(profile_data->'project_history'->>'achievements', '')
WHERE key_achievements IS NULL
  AND profile_data ? 'project_history'
  AND COALESCE(profile_data->'project_history'->>'achievements', '') <> '';

UPDATE public.supervisors
SET current_project_info = NULLIF(profile_data->>'current_project_info', '')
WHERE current_project_info IS NULL
  AND COALESCE(profile_data->>'current_project_info', '') <> '';

UPDATE public.supervisors
SET applicant_expectations = NULLIF(profile_data->>'applicant_expectations', '')
WHERE applicant_expectations IS NULL
  AND COALESCE(profile_data->>'applicant_expectations', '') <> '';
