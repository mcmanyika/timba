
-- 1) Restrict user_roles writes to admins only
CREATE POLICY "admins insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) Prevent subscriber email enumeration via unique-constraint errors.
-- Deduplicate first, then enforce uniqueness, then silently swallow duplicates via trigger.
DELETE FROM public.subscribers a
USING public.subscribers b
WHERE a.ctid < b.ctid
  AND lower(a.email) = lower(b.email);

CREATE UNIQUE INDEX IF NOT EXISTS subscribers_email_lower_unique
  ON public.subscribers (lower(email));

CREATE OR REPLACE FUNCTION public.subscribers_ignore_duplicates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.subscribers
    WHERE lower(email) = lower(NEW.email)
  ) THEN
    -- Pretend success without leaking existence
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscribers_dedupe_before_insert ON public.subscribers;
CREATE TRIGGER subscribers_dedupe_before_insert
  BEFORE INSERT ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION public.subscribers_ignore_duplicates();
