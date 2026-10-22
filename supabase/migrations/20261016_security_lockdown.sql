-- =====================================================================================
-- SECURITY LOCKDOWN
-- Run once in the Supabase SQL editor (Dashboard > SQL Editor > New query).
--
-- Why: earlier "fix" scripts created policies like  FOR ALL USING (true) WITH CHECK (true)  on scripts,
-- showcases, tickets, licenses and junkie_sessions. The anon key is public (it ships in the website), so
-- those policies let ANYONE read or change those tables. The admin panel only needed them because it used
-- a fake login that never created a Supabase session. Admin now signs in for real, so we can lock it down.
-- Safe to re-run.
-- =====================================================================================

-- 1) Drop every wide-open write policy (condition is just `true`) on the public tables.
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd IN ('ALL', 'INSERT', 'UPDATE', 'DELETE')
      AND (qual IS NULL OR qual = 'true')
      AND (with_check IS NULL OR with_check = 'true')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
    RAISE NOTICE 'Dropped open policy % on %', p.policyname, p.tablename;
  END LOOP;
END $$;

-- 2) Re-create the intended policies.

-- scripts: everyone reads, only admins write
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Scripts are viewable by everyone" ON public.scripts;
DROP POLICY IF EXISTS "Admins can manage scripts" ON public.scripts;
CREATE POLICY "Scripts are viewable by everyone" ON public.scripts FOR SELECT USING (true);
CREATE POLICY "Admins can manage scripts" ON public.scripts FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- showcases: everyone reads, only admins write
ALTER TABLE public.showcases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view showcases" ON public.showcases;
DROP POLICY IF EXISTS "Admins can manage showcases" ON public.showcases;
CREATE POLICY "Anyone can view showcases" ON public.showcases FOR SELECT USING (true);
CREATE POLICY "Admins can manage showcases" ON public.showcases FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- licenses: users read their own, only admins write (the website no longer writes licenses from the browser)
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own licenses" ON public.licenses;
DROP POLICY IF EXISTS "Admins can manage licenses" ON public.licenses;
CREATE POLICY "Users can view own licenses" ON public.licenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage licenses" ON public.licenses FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- tickets: users create and read their own, admins manage all
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can manage tickets" ON public.tickets;
CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON public.tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'open');
CREATE POLICY "Admins can manage tickets" ON public.tickets FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- payments: users must not be able to create (or mark as completed) their own payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage payments" ON public.payments FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles: users may only read their own role. Nobody can grant themselves admin from the browser.
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- junkie_sessions (not used by the site): RLS on with no policies = nobody can touch it from the browser
DO $$
BEGIN
  IF to_regclass('public.junkie_sessions') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.junkie_sessions ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- The key generator was only used by the removed payment webhook.
REVOKE ALL ON FUNCTION public.generate_license_key() FROM PUBLIC, anon, authenticated;

-- 3) Make the owner an admin (the account must already exist in Authentication > Users).
--    To use a different email, change it here and run this statement on its own.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE lower(email) = 'anaslhras@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Check: should list exactly your admin account(s).
SELECT u.email, r.role FROM public.user_roles r JOIN auth.users u ON u.id = r.user_id WHERE r.role = 'admin';
