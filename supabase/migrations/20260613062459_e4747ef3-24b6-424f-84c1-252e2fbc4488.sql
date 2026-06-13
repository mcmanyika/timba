
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============ CONTENT TYPES ============
CREATE TYPE public.content_type AS ENUM ('essay', 'policy_paper', 'speech', 'book', 'media');
CREATE TYPE public.content_category AS ENUM (
  'zimbabwe','constitution_democracy','africa','global_affairs','political_economy','statecraft',
  'parliament','conferences','international','dcp','interviews','podcasts','television'
);

-- ============ PUBLICATIONS ============
CREATE TABLE public.publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_number TEXT UNIQUE NOT NULL,
  type content_type NOT NULL,
  category content_category,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  body TEXT,
  featured_image_url TEXT,
  pdf_url TEXT,
  media_embed_url TEXT,
  location TEXT,
  occasion TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  publication_date DATE NOT NULL DEFAULT CURRENT_DATE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.publications TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.publications TO authenticated;
GRANT ALL ON public.publications TO service_role;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public reads published" ON public.publications FOR SELECT TO anon, authenticated
USING (published = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "admins manage publications" ON public.publications FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE INDEX idx_publications_type ON public.publications(type);
CREATE INDEX idx_publications_category ON public.publications(category);
CREATE INDEX idx_publications_published ON public.publications(published, publication_date DESC);
CREATE INDEX idx_publications_search ON public.publications USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(body,'')));

-- Auto-generate publication_number TP-YYYY-XXX
CREATE OR REPLACE FUNCTION public.generate_publication_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  yr TEXT;
  nxt INT;
BEGIN
  IF NEW.publication_number IS NULL OR NEW.publication_number = '' THEN
    yr := to_char(coalesce(NEW.publication_date, CURRENT_DATE), 'YYYY');
    SELECT COALESCE(MAX(CAST(split_part(publication_number, '-', 3) AS INT)), 0) + 1
      INTO nxt FROM public.publications
      WHERE publication_number LIKE 'TP-' || yr || '-%';
    NEW.publication_number := 'TP-' || yr || '-' || lpad(nxt::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_publications_number BEFORE INSERT ON public.publications
FOR EACH ROW EXECUTE FUNCTION public.generate_publication_number();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_publications_touch BEFORE UPDATE ON public.publications
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ SUBSCRIBERS ============
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.subscribers TO anon, authenticated;
GRANT SELECT, DELETE ON public.subscribers TO authenticated;
GRANT ALL ON public.subscribers TO service_role;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can subscribe" ON public.subscribers FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "admins view subscribers" ON public.subscribers FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete subscribers" ON public.subscribers FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
