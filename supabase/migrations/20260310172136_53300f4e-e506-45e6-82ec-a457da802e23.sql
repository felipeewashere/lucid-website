
CREATE OR REPLACE FUNCTION public.generate_license_key()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  key TEXT;
BEGIN
  key := 'LUCID-' || 
    upper(substr(md5(random()::text), 1, 4)) || '-' ||
    upper(substr(md5(random()::text), 1, 4)) || '-' ||
    upper(substr(md5(random()::text), 1, 4)) || '-' ||
    upper(substr(md5(random()::text), 1, 4));
  RETURN key;
END;
$$;
