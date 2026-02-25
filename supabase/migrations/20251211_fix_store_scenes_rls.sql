-- Fix store_scenes RLS policies to support organization members
-- Current policy only allows store owner (stores.user_id = auth.uid())
-- This change allows org members to create/update/delete scenes for org stores

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can create their store scenes" ON public.store_scenes;
DROP POLICY IF EXISTS "Users can view their store scenes" ON public.store_scenes;
DROP POLICY IF EXISTS "Users can update their store scenes" ON public.store_scenes;
DROP POLICY IF EXISTS "Users can delete their store scenes" ON public.store_scenes;
DROP POLICY IF EXISTS "Users can create their own store scenes" ON public.store_scenes;
DROP POLICY IF EXISTS "Users can view their own store scenes" ON public.store_scenes;
DROP POLICY IF EXISTS "Users can update their own store scenes" ON public.store_scenes;
DROP POLICY IF EXISTS "Users can delete their own store scenes" ON public.store_scenes;
DROP POLICY IF EXISTS "Users can create store scenes" ON public.store_scenes;
DROP POLICY IF EXISTS "Org members can view org store scenes" ON public.store_scenes;

-- Helper function to check store access
-- Uses existing is_org_member function and organization_members table
CREATE OR REPLACE FUNCTION public.user_can_access_store(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores s
    LEFT JOIN public.organization_members om ON om.org_id = s.org_id AND om.user_id = auth.uid()
    WHERE s.id = p_store_id
    AND (
      s.user_id = auth.uid()  -- User owns the store directly
      OR om.user_id IS NOT NULL  -- User is a member of the org
    )
  );
$$;

-- Simple INSERT policy: user must own the record AND have access to the store
CREATE POLICY "store_scenes_insert_policy" ON public.store_scenes
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (store_id IS NULL OR public.user_can_access_store(store_id))
);

-- SELECT policy: user owns the record AND has access to the store
CREATE POLICY "store_scenes_select_policy" ON public.store_scenes
FOR SELECT
USING (
  auth.uid() = user_id
  AND (store_id IS NULL OR public.user_can_access_store(store_id))
);

-- Also allow org members to view any scene for stores they have access to
CREATE POLICY "store_scenes_org_select_policy" ON public.store_scenes
FOR SELECT
USING (
  store_id IS NOT NULL
  AND public.user_can_access_store(store_id)
);

-- UPDATE policy
CREATE POLICY "store_scenes_update_policy" ON public.store_scenes
FOR UPDATE
USING (
  auth.uid() = user_id
  AND (store_id IS NULL OR public.user_can_access_store(store_id))
);

-- DELETE policy
CREATE POLICY "store_scenes_delete_policy" ON public.store_scenes
FOR DELETE
USING (
  auth.uid() = user_id
  AND (store_id IS NULL OR public.user_can_access_store(store_id))
);
