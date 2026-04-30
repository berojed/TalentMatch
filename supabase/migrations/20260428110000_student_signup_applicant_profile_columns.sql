-- Update handle_new_user so student signup metadata maps to explicit applicant columns.
-- Backward-compatible with old "degree_level" string keys; new clients send degree_level_id directly.
-- Removes any write to nickname / research_interests / interests / profile_data.

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_role_id integer;
  v_first_name text;
  v_last_name text;
  v_degree_level_id integer;
  v_degree_level_text text;
  v_graduation_year integer;
  v_skills text[];
  v_skills_jsonb jsonb;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

  IF v_role = 'supervisor' THEN
    v_role_id := 2;
  ELSE
    v_role_id := 1;
  END IF;

  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name  := COALESCE(NEW.raw_user_meta_data->>'last_name', '');

  INSERT INTO public.users (user_id, email, role_id, is_active)
  VALUES (NEW.id, NEW.email, v_role_id, true)
  ON CONFLICT (user_id) DO NOTHING;

  IF v_role = 'supervisor' THEN
    INSERT INTO public.supervisors (user_id, first_name, last_name, department, institution, academic_title, is_verified)
    VALUES (
      NEW.id,
      v_first_name,
      v_last_name,
      COALESCE(NEW.raw_user_meta_data->>'department', ''),
      COALESCE(NEW.raw_user_meta_data->>'institution', ''),
      COALESCE(NEW.raw_user_meta_data->>'academic_title', ''),
      false
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    -- Prefer explicit degree_level_id (new clients); fall back to legacy string key.
    IF (NEW.raw_user_meta_data->>'degree_level_id') ~ '^[0-9]+$' THEN
      v_degree_level_id := (NEW.raw_user_meta_data->>'degree_level_id')::integer;
    ELSE
      v_degree_level_text := NEW.raw_user_meta_data->>'degree_level';
      v_degree_level_id := CASE
        WHEN v_degree_level_text = 'phd' THEN 3
        WHEN v_degree_level_text IN ('masters', 'master') THEN 2
        ELSE 1
      END;
    END IF;

    IF (NEW.raw_user_meta_data->>'graduation_year') ~ '^[0-9]+$' THEN
      v_graduation_year := (NEW.raw_user_meta_data->>'graduation_year')::integer;
    ELSE
      v_graduation_year := NULL;
    END IF;

    -- skills may arrive as a JSON array of strings.
    v_skills_jsonb := NEW.raw_user_meta_data->'skills';
    IF jsonb_typeof(v_skills_jsonb) = 'array' THEN
      SELECT COALESCE(array_agg(value), '{}'::text[])
      INTO v_skills
      FROM jsonb_array_elements_text(v_skills_jsonb) AS t(value)
      WHERE NULLIF(value, '') IS NOT NULL;
    ELSE
      v_skills := '{}'::text[];
    END IF;

    INSERT INTO public.applicants (
      user_id,
      first_name,
      last_name,
      degree_level_id,
      institution,
      field_of_study,
      graduation_year,
      experience,
      projects,
      skills,
      awards,
      additional_notes
    )
    VALUES (
      NEW.id,
      v_first_name,
      v_last_name,
      v_degree_level_id,
      NULLIF(NEW.raw_user_meta_data->>'institution', ''),
      NULLIF(NEW.raw_user_meta_data->>'field_of_study', ''),
      v_graduation_year,
      NULLIF(NEW.raw_user_meta_data->>'experience', ''),
      NULLIF(NEW.raw_user_meta_data->>'projects', ''),
      v_skills,
      NULLIF(NEW.raw_user_meta_data->>'awards', ''),
      NULLIF(NEW.raw_user_meta_data->>'additional_notes', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
