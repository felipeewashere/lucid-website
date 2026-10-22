-- =====================================================================================
-- LOADER SCRIPT
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- Holds the Lua script that /loader.lua serves. Only admins can read or write it from the browser
-- (so the anon key can never download it). The server route reads it with the service role key,
-- which bypasses row level security.
-- =====================================================================================

CREATE TABLE IF NOT EXISTS public.loader_scripts (
  id          text PRIMARY KEY DEFAULT 'main',
  content     text NOT NULL DEFAULT '',
  enabled     boolean NOT NULL DEFAULT true,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loader_scripts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage loader" ON public.loader_scripts;
CREATE POLICY "Admins can manage loader" ON public.loader_scripts FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.loader_scripts (id, content, enabled) VALUES ('main', '', false)
ON CONFLICT (id) DO NOTHING;
