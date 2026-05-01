-- ============================================================
-- PESEYIE CONSTRUCTIONS — Admin Role Fix
-- Run this in: Supabase Dashboard → SQL Editor
-- Admin email: cacotet92@gmail.com
-- ============================================================

-- Step 1: Ensure a profile exists for the admin user
INSERT INTO public.profiles (id, full_name)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', email, 'Admin')
FROM auth.users
WHERE email = 'cacotet92@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Step 2: Ensure user_roles row exists for the admin user, then set to 'admin'
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'cacotet92@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Step 3: Set all other users to 'viewer' (optional safety step)
UPDATE public.user_roles
SET role = 'viewer'
WHERE user_id NOT IN (
  SELECT id FROM auth.users WHERE email = 'cacotet92@gmail.com'
);

-- Step 4: Verify — should show cacotet92@gmail.com with role = admin
SELECT
  u.email,
  p.full_name,
  ur.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
ORDER BY u.created_at;
