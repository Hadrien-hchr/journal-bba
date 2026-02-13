
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the user is already an admin (bypass domain restriction)
  -- Otherwise, only allow @edu.em-lyon.com emails
  IF NOT (NEW.email LIKE '%@edu.em-lyon.com') THEN
    -- Check if there's already an admin with this email (existing admins are allowed)
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = NEW.id AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Seules les adresses email @edu.em-lyon.com sont autorisées';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;
