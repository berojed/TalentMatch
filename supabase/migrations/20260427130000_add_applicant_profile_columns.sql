-- Migration A: add explicit applicant profile columns and backfill from profile_data.
-- Backward-safe additive migration. Legacy columns (profile_data, interests, cv_document_id)
-- are NOT dropped here; that happens in a follow-up cleanup migration after code/SQL audit.

ALTER TABLE public.applicants
  ADD COLUMN IF NOT EXISTS field_of_study   text,
  ADD COLUMN IF NOT EXISTS graduation_year  integer,
  ADD COLUMN IF NOT EXISTS experience       text,
  ADD COLUMN IF NOT EXISTS projects         text,
  ADD COLUMN IF NOT EXISTS skills           text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS awards           text,
  ADD COLUMN IF NOT EXISTS additional_notes text;

-- Backfill scalar text fields from profile_data.academic and profile_data.additional_notes.
UPDATE public.applicants
SET field_of_study = NULLIF(profile_data->'academic'->>'field_of_study', '')
WHERE field_of_study IS NULL
  AND profile_data ? 'academic'
  AND COALESCE(profile_data->'academic'->>'field_of_study', '') <> '';

UPDATE public.applicants
SET graduation_year = (profile_data->'academic'->>'graduation_year')::integer
WHERE graduation_year IS NULL
  AND profile_data ? 'academic'
  AND (profile_data->'academic'->>'graduation_year') ~ '^[0-9]+$';

UPDATE public.applicants
SET additional_notes = NULLIF(profile_data->>'additional_notes', '')
WHERE additional_notes IS NULL
  AND COALESCE(profile_data->>'additional_notes', '') <> '';

-- Backfill skills text[] from profile_data.skills (jsonb array of strings).
UPDATE public.applicants
SET skills = COALESCE(
  (
    SELECT array_agg(value::text)
    FROM jsonb_array_elements_text(profile_data->'skills') AS t(value)
    WHERE NULLIF(value, '') IS NOT NULL
  ),
  '{}'::text[]
)
WHERE skills = '{}'::text[]
  AND jsonb_typeof(profile_data->'skills') = 'array';

-- Backfill awards as newline-delimited text from profile_data.awards (array or string).
UPDATE public.applicants
SET awards = (
  SELECT string_agg(value, E'\n')
  FROM jsonb_array_elements_text(profile_data->'awards') AS t(value)
  WHERE NULLIF(value, '') IS NOT NULL
)
WHERE awards IS NULL
  AND jsonb_typeof(profile_data->'awards') = 'array';

UPDATE public.applicants
SET awards = NULLIF(profile_data->>'awards', '')
WHERE awards IS NULL
  AND jsonb_typeof(profile_data->'awards') = 'string';

-- Backfill experience as a deterministic block-formatted text:
--   Role: ...
--   Organization: ...
--   Duration: ...
--   Description: ...
-- Blocks separated by a blank line.
UPDATE public.applicants a
SET experience = sub.serialized
FROM (
  SELECT
    a2.user_id,
    string_agg(
      'Role: ' || COALESCE(elem->>'role','') || E'\n' ||
      'Organization: ' || COALESCE(elem->>'organization','') || E'\n' ||
      'Duration: ' || COALESCE(elem->>'duration','') || E'\n' ||
      'Description: ' || COALESCE(elem->>'description',''),
      E'\n\n'
    ) AS serialized
  FROM public.applicants a2
  CROSS JOIN LATERAL jsonb_array_elements(a2.profile_data->'experience') AS elem
  WHERE jsonb_typeof(a2.profile_data->'experience') = 'array'
  GROUP BY a2.user_id
) sub
WHERE a.user_id = sub.user_id
  AND a.experience IS NULL
  AND sub.serialized IS NOT NULL
  AND sub.serialized <> '';

-- Backfill projects as a deterministic block-formatted text:
--   Title: ...
--   Description: ...
--   Methods/Technologies: ...
UPDATE public.applicants a
SET projects = sub.serialized
FROM (
  SELECT
    a2.user_id,
    string_agg(
      'Title: ' || COALESCE(elem->>'title','') || E'\n' ||
      'Description: ' || COALESCE(elem->>'description','') || E'\n' ||
      'Methods/Technologies: ' || COALESCE(elem->>'methods_technologies',''),
      E'\n\n'
    ) AS serialized
  FROM public.applicants a2
  CROSS JOIN LATERAL jsonb_array_elements(a2.profile_data->'projects_research') AS elem
  WHERE jsonb_typeof(a2.profile_data->'projects_research') = 'array'
  GROUP BY a2.user_id
) sub
WHERE a.user_id = sub.user_id
  AND a.projects IS NULL
  AND sub.serialized IS NOT NULL
  AND sub.serialized <> '';
