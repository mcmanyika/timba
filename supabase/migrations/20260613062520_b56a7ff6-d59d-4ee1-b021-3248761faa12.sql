
DROP POLICY "anyone can subscribe" ON public.subscribers;
CREATE POLICY "anyone can subscribe" ON public.subscribers FOR INSERT TO anon, authenticated
WITH CHECK (
  length(trim(first_name)) BETWEEN 1 AND 100
  AND length(email) BETWEEN 5 AND 255
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);
