-- Update handle_new_user so supervisor signup metadata maps to explicit supervisor columns.
-- Backward-compatible: still accepts legacy keys; new clients send the explicit profile fields.

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
  v_research_areas text[];
  v_research_jsonb jsonb;
  v_years_experience integer;
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
    -- research_areas may arrive as a JSON array of strings.
    v_research_jsonb := NEW.raw_user_meta_data->'research_areas';
    IF jsonb_typeof(v_research_jsonb) = 'array' THEN
      SELECT COALESCE(array_agg(value), '{}'::text[])
      INTO v_research_areas
      FROM jsonb_array_elements_text(v_research_jsonb) AS t(value)
      WHERE NULLIF(value, '') IS NOT NULL;
    ELSE
      v_research_areas := '{}'::text[];
    END IF;

    IF (NEW.raw_user_meta_data->>'years_experience') ~ '^[0-9]+$' THEN
      v_years_experience := (NEW.raw_user_meta_data->>'years_experience')::integer;
    ELSE
      v_years_experience := NULL;
    END IF;

    INSERT INTO public.supervisors (
      user_id,
      first_name,
      last_name,
      department,
      institution,
      academic_title,
      is_verified,
      lab_name,
      research_areas,
      years_experience,
      short_bio,
      past_projects,
      key_achievements,
      current_project_info,
      applicant_expectations
    )
    VALUES (
      NEW.id,
      v_first_name,
      v_last_name,
      COALESCE(NEW.raw_user_meta_data->>'department', ''),
      COALESCE(NEW.raw_user_meta_data->>'institution', ''),
      COALESCE(NEW.raw_user_meta_data->>'academic_title', ''),
      false,
      NULLIF(NEW.raw_user_meta_data->>'lab_name', ''),
      v_research_areas,
      v_years_experience,
      NULLIF(NEW.raw_user_meta_data->>'short_bio', ''),
      NULLIF(NEW.raw_user_meta_data->>'past_projects', ''),
      NULLIF(NEW.raw_user_meta_data->>'key_achievements', ''),
      NULLIF(NEW.raw_user_meta_data->>'current_project_info', ''),
      NULLIF(NEW.raw_user_meta_data->>'applicant_expectations', '')
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
