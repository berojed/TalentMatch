-- Migration B: drop legacy applicant profile columns and update the
-- auth bootstrap trigger so it no longer writes interests.

-- Update handle_new_user to stop writing applicants.interests on signup.
-- All other behavior preserved.
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
    v_degree_level_id := CASE
      WHEN (NEW.raw_user_meta_data->>'degree_level') = 'phd' THEN 3
      WHEN (NEW.raw_user_meta_data->>'degree_level') IN ('masters', 'master') THEN 2
      ELSE 1
    END;

    INSERT INTO public.applicants (user_id, first_name, last_name, degree_level_id)
    VALUES (
      NEW.id,
      v_first_name,
      v_last_name,
      v_degree_level_id
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Drop legacy columns now that no app or SQL object references them.
ALTER TABLE public.applicants
  DROP COLUMN IF EXISTS profile_data,
  DROP COLUMN IF EXISTS interests,
  DROP COLUMN IF EXISTS cv_document_id;
